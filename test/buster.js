var config = exports;

config['Browser tests'] = {
    rootPath: '../',
    environment: 'browser',
    libs: [
        'example/lib/mootools-core.js',
        // need ES5 shim for buster static and IE6/7/8
        'test/lib/es5-shim.min.js'
    ],
    sources: [
        // core
        'src/epitome.js',
        // utils
        'src/epitome-isequal.js',
        // model core
        'src/epitome-model.js',
        // controller/collection
        'src/epitome-collection.js',

        // extending extras
        'src/epitome-model-sync.js'
    ],
    tests: [
        // find matching test specs as above sources
        'test/tests/*-test.js'
    ]
};