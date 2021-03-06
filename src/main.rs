use std::{str, env};
use bytes::Bytes;
use actix_http::{
    error::ErrorUnprocessableEntity,
    ResponseBuilder,
};
use actix_multipart::{
    Multipart,
    MultipartError,
};
use actix_web::{
    web,
    http,
    middleware,
    get,
    post,
    App,
    HttpResponse,
    HttpServer,
    Result,
};
use actix_web::error::{ErrorInternalServerError, ErrorNotFound, ErrorUnauthorized};
use actix_files::Files;
use handlebars::Handlebars;
use tokio::stream::StreamExt;
use tokio::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Clone)]
struct EmulatorData<'a> {
    slug: &'a str,
    display: &'a str,
    heading: &'a str,
}

const EMULATORS: &'static [EmulatorData<'static>] = &[
    EmulatorData { slug: "nes", display: "NES", heading: "NES" },
    EmulatorData { slug: "snes", display: "SNES", heading: "SNES" },
    EmulatorData { slug: "gb", display: "Gameboy", heading: "Gameboy" },
    EmulatorData { slug: "gbc", display: "Gameboy Color", heading: "GB Color" },
    EmulatorData { slug: "gba", display: "Gameboy Advance", heading: "GBA" },
    EmulatorData { slug: "n64", display: "N64", heading: "N64" },

    EmulatorData { slug: "genesis", display: "Genesis", heading: "Genesis" },
    EmulatorData { slug: "segacd", display: "Sega CD", heading: "Sega CD" },
    EmulatorData { slug: "sega32x", display: "Sega 32X", heading: "32X" },

    EmulatorData { slug: "neogeo", display: "Neo Geo", heading: "Neo Geo" },

    EmulatorData { slug: "psx", display: "PlayStation", heading: "PSX" },
];

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let port = match env::args().nth(1) {
        Some(port) => port,
        None => {
            eprintln!("Error: you must provide a port.");
            std::process::exit(1);
        }
    };

    HttpServer::new(|| {
        App::new()
            .wrap(middleware::Compress::default())
            .wrap(middleware::Logger::default())
            .service(Files::new("/static", "assets/static"))
            .service(index_page)
            .service(emulator_page)
            .service(upload_rom)
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}

#[derive(Serialize)]
struct IndexTemplateData {
    emulators: Vec<EmulatorData<'static>>
}

#[get("/")]
async fn index_page() -> Result<HttpResponse> {
    let reg = Handlebars::new();
    let index = read_file("assets/pages/index.html").await?;
    let data = IndexTemplateData {
        emulators: EMULATORS.to_vec(),
    };
    let rendered = reg
        .render_template(&index, &data)
        .map_err(ErrorInternalServerError)?;
    Ok(html_response(&mut HttpResponse::Ok(), rendered))
}

#[derive(Serialize)]
struct UploadTemplateData<'a> {
    emulator: &'a str,
    slug: &'a str,
    roms: &'a Vec<String>,
    no_roms: bool,
    csrf: &'a str,
}
#[derive(Deserialize)]
struct EmulatorPath {
    name: String,
}

/// IMPORTANT TODO: CSRF
/// Use a cookie session that indexes into some in-memory hash
#[get("/roms/{name}")]
async fn emulator_page(emulator_path: web::Path<EmulatorPath>) -> Result<HttpResponse> {
    let emulator = parse_emulator(&emulator_path.name)?;
    render_upload(&emulator).await
}

/// Renders the upload page
async fn render_upload<'a>(emulator: &EmulatorData<'a>) -> Result<HttpResponse> {
    let reg = Handlebars::new();
    let upload = read_file("assets/pages/upload.html").await?;
    let roms = read_dir(&format!("data/roms/{}", emulator.slug)).await?;
    let csrf = "token";
    let data = UploadTemplateData {
        emulator: &emulator.heading,
        slug: &emulator.slug,
        roms: &roms,
        no_roms: roms.len() == 0,
        csrf: &csrf,
    };
    let rendered = reg
        .render_template(&upload, &data)
        .map_err(ErrorInternalServerError)?;
    Ok(html_response(
        HttpResponse::Ok()
            .set_header(
                http::header::SET_COOKIE,
                "csrf=token; HttpOnly; SameSite=Lax; Path=/; Priority=High"
            ),
        rendered
    ))
}


#[post("/roms/{name}")]
async fn upload_rom(
    emulator_path: web::Path<EmulatorPath>,
    mut payload: Multipart,
) -> Result<HttpResponse> {
    let emulator = parse_emulator(&emulator_path.name)?;

    let mut csrf: Option<String> = None;
    while let Some(mut field) = payload.try_next().await? {
        let content_type = field
            .content_disposition()
            .ok_or_else(|| actix_web::error::ParseError::Incomplete)?;

        match content_type.get_name() {
            Some("csrf") => {
                let bytes = field.collect::<std::result::Result<Bytes, MultipartError>>().await?;
                let token = String::from_utf8(bytes.to_vec()).map_err(|_| {
                    ErrorUnprocessableEntity("CSRF token must be UTF-8")
                })?;
                csrf = Some(token);
            },
            Some("filename") => {
                if let None = csrf {
                    return Err(ErrorUnauthorized("Not authorized; please reload and try again"));
                }
                let filename = content_type
                    .get_filename()
                    .ok_or_else(|| actix_web::error::ParseError::Incomplete)?;
                let path = sanitize_filename::sanitize(&filename);

                // Create the appropriate emulator dir if necessary
                let dir = format!("data/roms/{}", emulator.slug);
                tokio::fs::create_dir_all(dir.clone()).await?;

                // Write all the bytes of the stream to disk
                let mut file = tokio::fs::File::create(
                    format!("{}/{}", dir, path)
                ).await?;
                while let Some(chunk) = field.next().await {
                    let data = chunk?;
                    file.write_all(&data).await?
                }
            },
            Some(other) => {
                return Err(ErrorUnprocessableEntity(format!("Unknown field {}", other)));
            }
            None => {
                return Err(ErrorUnprocessableEntity("Missing field name"));
            }
        }
    }

    // Render the upload page so people can upload more ROMs
    render_upload(&emulator).await
}

/// Given a slug, returns the matching EmulatorData.
///
fn parse_emulator(slug: &str) -> Result<&EmulatorData<'static>> {
    let emulator_search = EMULATORS.iter().find(|emulator_data| {
        emulator_data.slug == slug
    });
    match emulator_search {
        None => Err(ErrorNotFound(format!("No emulator: {}", slug))),
        Some(emulator_data) => Ok(emulator_data)
    }
}

/// Read an entire file to a string
async fn read_file(path: &str) -> Result<String> {
    let bytes = tokio::fs::read(path).await?;
    Ok(str::from_utf8(&bytes)?.to_string())
}

/// Read an entire directory to a Vec of strings
async fn read_dir(path: &str) -> Result<Vec<String>> {
    let dir_to_read = tokio::fs::read_dir(path).await;
    match dir_to_read {
        Err(_) => {
            // The path doesn't exist, aka no ROMs. That's fine.
            Ok(vec!())
        },
        Ok(dir) => {
            let entries = dir
                .map(|dir_entry| {
                    let filename = dir_entry
                        .map_err(ErrorInternalServerError)?
                        .file_name()
                        .into_string()
                        .map_err(|_| {
                            ErrorInternalServerError("Invalid ROM filename found on disk")
                        })?;

                    Ok(filename)
                })
                .collect::<Result<Vec<String>>>()
                .await?;

            Ok(entries)
        }
    }
}

/// Given a ResponseBuilder, set its content type and body to return the string as HTML
fn html_response(response: &mut ResponseBuilder, body: String) -> HttpResponse {
    response
        .set_header(http::header::CONTENT_TYPE, "text/html; charset=utf-8")
        .set_header(http::header::X_FRAME_OPTIONS, "DENY")
        .body(body)
}
