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

A fast, light webserver for easily uploading ROMs directly to a Raspberry Pi
running RetroPie. Go to `<hostname>.lan:<port>` and drop ROMs onto your Pi.

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
