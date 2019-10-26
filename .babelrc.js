module.exports = {
  presets: [
    // @babel/env config
    [
      '@babel/env',
      {
        targets: {
          node: '10.16.3'
        },
        corejs: '3',
        useBuiltIns: 'usage',
        debug: false
      }
    ]
  ],
  plugins: ['@babel/plugin-proposal-object-rest-spread']
}
