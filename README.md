# Pandoc Citations

## Features

* Autocompletion for BibTeX citation keys. Just point `citations.bibfile` to your BibTeX library file and hit `@` to start.
* Search and insert BibTeX citation keys:
    1. Select *Pandoc Citations: Insert Citekey* from the Command Palette
    2. Search and pick an entry
    3. Hit `Enter` to insert
* Insert bracketed Pandoc citations:
    1. Select *Pandoc Citations: Insert Pandoc Citation* from the Command Palette
    2. Search and pick an entry
    3. Hit `Enter` to insert
    4. The citation is inserted as a Snippet, so you can use `Tab` to navigate prefix, suffix and end-of-citation

## Extension Settings

* `pandoc-citations.bibfiles`
  A list of BibTeX files used as data sources.
* `pandoc-citations.debug`
  Enable debug logging.
* `pandoc-citations.placeholders.noAuthor`
  `pandoc-citations.placeholders.noDate`
  Some bibliography entries don't have an associated author or date. In this case, these
  placeholders are displayed instead
  
## Known issues

* Relative paths don't work in `pandoc-citations.bibfiles`

## Credits

James Yu's [LaTeX Workshop](https://github.com/James-Yu/LaTeX-Workshop) extension was a great source of inspiration.
