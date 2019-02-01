/**
 * Salesforce Resource Builder is a webpack plugin which compiles
 * visual force page and related metadata for page. It also compiles static resources
 * in zip file and is being reference on visual force page based on plugin configuration options.
 */
const webpack_merge = require('webpack-merge');
const path = require('path');
const JSZip = require('jszip');
const RawSource = require('webpack-sources/lib/RawSource');
const template = require('lodash/template');
const merge = require('lodash/merge');
const defaults = require('./default');

/**
 * Salesforce Resource Builder Class
 */
class Salesforce_ResourceBuilder {
  constructor(options) {
    this.options = webpack_merge(defaults, options);
  }

  simple_file_from_string(str) {
    return {
      source: () => str,
      size: () => str.length,
    };
  }

  config_for_extension(ext) {
    const { staticresource } = this.options;
    const page = this.options[this.options.pageType];

    switch (ext) {
      case staticresource.extension:
        return staticresource;
      case page.extension:
        return page;
      default:
        return null;
    }
  }

  is_root_asset(filename, chunks) {
    for (let x = 0; x < chunks.length; x += 1) {
      const currentChunk = chunks[x];
      if (!currentChunk.name) {
        for (let y = 0; y < currentChunk.files.length; y += 1) {
          const currentFile = currentChunk.files[y];
          if (filename === currentFile) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * generate bundle is used to return consolidate zipfolder for static resouces
   * which consist of assests used for the app.
   * @param {*} assets
   * returns a zip static resource folder.
   */
  generate_bundle(assets) {
    const { staticresource } = this.options;
    const fileTypeMapping = {};
    const zip = new JSZip();
    const assetExtensionNames = staticresource.assetsExtensions;

    const assetNames = Object.keys(assets).filter((asset) => {
      return assetExtensionNames.indexOf(path.extname(asset)) >= 0;
    });

    for (const assetName of assetNames) {
      const extname = path.extname(assetName);
      zip.file(assetName, assets[assetName].source());
      fileTypeMapping[assetName] = extname;
      delete assets[assetName];
    }
    const destRes = path.join(
      staticresource.folderName,
      staticresource.name + staticresource.extension,
    );

    return zip
      .generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
      .then((content) => {
        assets[destRes] = new RawSource(content);
        return fileTypeMapping;
      });
  }

  /**
   * Adds pages to salesforce deployment package.
   * @param {*} assets
   * @param {*} chunks
   * @param {*} originalTypes
   * return a update package folder which includes a page folder
   * consisting of page and page metadatafile.
   */
  add_page(assets, chunks, originalTypes) {
    const page = this.options[this.options.pageType];
    const { staticresource } = this.options;
    const compiledPageTemplate = template(page.template);
    const options = page.templateOptions;

    for (const assetName of Object.keys(originalTypes)) {
      const originalType = originalTypes[assetName];

      if (!options[originalType]) {
        options[originalType] = [];
      }

      if (this.is_root_asset(assetName, chunks)) {
        options[originalType].push(
          path.basename(assetName, staticresource.extension),
        );
      }
    }
    options.zipName = staticresource.name;
    const pageName = path.join(page.folderName, page.name + page.extension);

    assets[pageName] = this.simple_file_from_string(
      compiledPageTemplate({ options }),
    );
  }

  /**
   * creates a compiled packages for salesforce deployment.
   * @param {*} assets
   */
  add_package(assets) {
    const { sfPackage } = this.options;

    const compiledPackageTemplate = template(sfPackage.template);
    const options = merge(sfPackage.templateOptions, {
      resources: [],
      pages: [],
    });
    const assetNames = Object.keys(assets);

    for (const assetName of assetNames) {
      const assetExt = path.extname(assetName);
      const assetConfig = this.config_for_extension(assetExt);

      if (assetConfig) {
        if (!options[assetConfig.extension]) {
          options[assetConfig.extension] = [];
        }

        options[assetConfig.extension].push(path.basename(assetName, assetExt));
      }
    }
    assets[sfPackage.name + sfPackage.extension] = this.simple_file_from_string(
      compiledPackageTemplate({ options }),
    );
  }

  /**
   * builds metadata information for assest.
   * @param {*} assetName
   */
  build_metafile_for_asset(assetName) {
    const assetExt = path.extname(assetName);
    const assetConfig = this.config_for_extension(path.extname(assetName));

    if (!assetConfig || !assetConfig.metaTemplate) {
      return null;
    }

    const compiledTemplate = template(assetConfig.metaTemplate);

    const options = Object.assign({}, assetConfig.metaTemplateOptions || {}, {
      basename: path.basename(assetName, assetExt),
    });

    return this.simple_file_from_string(compiledTemplate({ options }));
  }

  /**
   * adds metadata files to package folder.
   * @param {*} assets
   */
  add_metafiles(assets) {
    const { metaExtension } = this.options;
    const assetNames = Object.keys(assets);
    assetNames.forEach((assetName) => {
      const metafile = this.build_metafile_for_asset(assetName);
      if (metafile) {
        assets[assetName + metaExtension] = metafile;
      }
    });
  }

  emit(compilation, callback) {
    return this.generate_bundle(compilation.assets, callback).then(
      (zippedAssets) => {
        this.add_page(compilation.assets, compilation.chunks, zippedAssets);
        this.add_package(compilation.assets);
        this.add_metafiles(compilation.assets);
        callback();
      },
    );
  }

  apply(compiler) {
    return compiler.hooks.emit.tapAsync('emit', this.emit.bind(this));
  }
}

module.exports = Salesforce_ResourceBuilder;
