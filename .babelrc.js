module.exports = {
  presets: [
    // @babel/env config
    [
      '@babel/env',
      {
        targets: {
          node: '4.8'
        },
        useBuiltIns: 'usage'
      }
    ]
  ],
  plugins: ['@babel/plugin-proposal-object-rest-spread']
}
