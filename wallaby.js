var wallabify = require("wallabify");

module.exports = function (wallaby) {
    
    var wallabyPostprocessor = wallabify({
        entryPatterns: [
            "test/**/*.js"
        ]
    });
    
    return {
        files : [
            { pattern: "src/**/*.ts", load: false },
            { pattern: "typings/browser.d.ts", load: false },
            { pattern: "node_modules/reflect-metadata/reflect-metadata.d.ts", load: false }
        ],
        tests: [
            { pattern: "test/**/*.ts", load: false },
        ],
        debug: true,
        testFramework: 'mocha',
        postprocessor: wallabyPostprocessor,
        setup: function () {
            window.__moduleBundler.loadTests();
        }
    };
};