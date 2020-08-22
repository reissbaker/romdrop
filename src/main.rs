use handlebars::Handlebars;
use actix_web::{web, get, App, HttpResponse, HttpServer, Result};
use actix_web::error::{ErrorInternalServerError, ErrorNotFound};
use actix_files::Files;
use serde::{Serialize, Deserialize};
use std::{str, env};

#[derive(Serialize, Clone)]
struct EmulatorData<'a> {
    slug: &'a str,
    display: &'a str,
    heading: &'a str,
}

const EMULATORS: &'static [EmulatorData<'static>] = &[
    EmulatorData { slug: "nes", display: "NES", heading: "NES" },
    EmulatorData { slug: "snes", display: "SNES", heading: "SNES" },
    EmulatorData { slug: "gb", display: "Gameboy", heading: "GB" },
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
    let port = match env::args().nth(1) {
        Some(port) => port,
        None => {
            eprintln!("Error: you must provide a port.");
            std::process::exit(1);
        }
    };
    HttpServer::new(|| {
        App::new()
            .service(Files::new("/static", "assets/static"))
            .service(index)
            .service(emulator)
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
async fn index() -> Result<HttpResponse> {
    let reg = Handlebars::new();
    let index = read_file("assets/pages/index.html").await?;
    let data = IndexTemplateData {
        emulators: EMULATORS.to_vec(),
    };
    let rendered = reg.render_template(&index, &data)
        .map_err(ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().body(rendered))
}

#[derive(Serialize)]
struct UploadTemplateData<'a> {
    emulator: &'a str,
}
#[derive(Deserialize)]
struct EmulatorPath {
    name: String,
}
#[get("/system/{name}")]
async fn emulator(emulator_path: web::Path<EmulatorPath>) -> Result<HttpResponse> {
    let slug = emulator_path.name.clone();
    let matching_slug = EMULATORS.iter().find(|emulator_data| {
        emulator_data.slug == slug
    });
    match matching_slug {
        None => Err(ErrorNotFound("not found")),
        Some(matching_slug) => {
            let reg = Handlebars::new();
            let upload = read_file("assets/pages/upload.html").await?;
            let data = UploadTemplateData {
                emulator: &matching_slug.heading.to_uppercase(),
            };
            let rendered = reg.render_template(&upload, &data)
                .map_err(ErrorInternalServerError)?;
            Ok(HttpResponse::Ok().body(rendered))
        }
    }
}

async fn read_file(path: &str) -> Result<String> {
    let bytes = tokio::fs::read(path).await?;
    Ok(str::from_utf8(&bytes)?.to_string())
}
