const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Encuentra la regla de SVGO
      const svgRule = webpackConfig.module.rules.find(rule => 
        rule.test && rule.test.toString().includes('svg')
      );
      
      if (svgRule) {
        // Modifica la configuración de SVGO para usar la versión más reciente
        svgRule.use = svgRule.use.map(loader => {
          if (loader.loader && loader.loader.includes('@svgr/webpack')) {
            return {
              ...loader,
              options: {
                ...loader.options,
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: {
                        overrides: {
                          removeViewBox: false
                        }
                      }
                    }
                  ]
                }
              }
            };
          }
          return loader;
        });
      }
      
      return webpackConfig;
    }
  },
};
