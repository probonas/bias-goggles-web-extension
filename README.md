# Bias Goggles Web Extension

## How to install dependencies
```bash
npm install
```

## How to create the web extension
```bash
npx webpack
```

## Notes
The extension is located under dist folder. For now use the dist/firefox files regardless
of the browser you are installing it.

Being quite rudimentary in its logic and conservative of the API calls it's using,
the extension should work on browsers implementing WebExtensions API as is.

Check your browser's documentation on how to load an extension.
