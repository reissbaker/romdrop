```
  _______    ______   __       __        _______   _______    ______   _______
 /       \  /      \ /  \     /  |      /       \ /       \  /      \ /       \
 $$$$$$$  |/$$$$$$  |$$  \   /$$ |      $$$$$$$  |$$$$$$$  |/$$$$$$  |$$$$$$$  |
 $$ |__$$ |$$ |  $$ |$$$  \ /$$$ |      $$ |  $$ |$$ |__$$ |$$ |  $$ |$$ |__$$ |
 $$    $$< $$ |  $$ |$$$$  /$$$$ |      $$ |  $$ |$$    $$< $$ |  $$ |$$    $$/
 $$$$$$$  |$$ |  $$ |$$ $$ $$/$$ |      $$ |  $$ |$$$$$$$  |$$ |  $$ |$$$$$$$/
 $$ |  $$ |$$ \__$$ |$$ |$$$/ $$ |      $$ |__$$ |$$ |  $$ |$$ \__$$ |$$ |
 $$ |  $$ |$$    $$/ $$ | $/  $$ |      $$    $$/ $$ |  $$ |$$    $$/ $$ |
 $$/   $$/  $$$$$$/  $$/      $$/       $$$$$$$/  $$/   $$/  $$$$$$/  $$/
```

A fast, light webserver for easily uploading ROMs to a Raspberry Pi running
RetroPie. Run the server on your Pi, and go to `<hostname>.lan:<port>` to drop
ROMs in.

# Dependencies
[Rust](https://rustup.rs/) and (for development only) [Rollup](https://rollupjs.org/).

# Development

To run the server:
```bash
cargo run <PORT>
```

To build the JS:

```bash
cd assets/javascript
rollup --config
```

# Building and running on your Pi

The compiled JavaScript is checked into builds on Github, so you won't need the
JS toolchain on your Pi: you'll only need Rust. To build and run the webserver:

```bash
cargo build --release
./target/release/romdrop <PORT>
```
