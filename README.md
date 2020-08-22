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
[Rust](https://rustup.rs/) and [Rollup](https://rollupjs.org/).

# Building

```
cargo build --release
cd assets/javascript
rollup --config
```

# Running

```
./target/release/romdrop <PORT>
```
