module.exports = {
  packagerConfig: {
    asar: true,
    icon: './build/icons/icon',
    extraResource: [
      'server.js',
      'dist'
    ],
    ignore: [
      "^/node_modules",
      "^/src",
      "^/.git",
      "^/mongo_data"
    ],
    win32metadata: {
      CompanyName: "ICD-10-CM Browser",
      FileDescription: "ICD-10-CM Browser Desktop Application",
      OriginalFilename: "icd10cm-browser.exe",
      ProductName: "ICD-10-CM Browser",
      InternalName: "icd10cm-browser"
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'icd10cm_browser',
        setupIcon: './build/icons/icon.ico',
        loadingGif: './build/splash.gif',
        iconUrl: 'https://raw.githubusercontent.com/stabgan/icd10cm-browser/main/build/icons/icon.ico',
        setupExe: 'ICD-10-CM-Browser-Setup.exe',
        noMsi: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './build/icons/icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './build/icons/icon.png'
        }
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives'
    }
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      // You can add custom steps here after files are copied to the build directory
      console.log(`Packaging for ${platform} ${arch}...`);
    }
  }
}; 