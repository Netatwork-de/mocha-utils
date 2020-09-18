import { FilePattern, ConfigOptions } from 'karma';

class KarmaMochaHtmlReporter {
    public static readonly $inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError'] as const;
    public constructor(
        decorator: Function,
        config: ConfigOptions,
    ) {
        const MOCHA_CORE_PATTERN = /([\\/]karma-mocha[\\/])/i;
        const createPattern: (pattern: string) => FilePattern = (pattern: string) => ({ pattern, included: true, served: true, watched: false });

        decorator(this);

        const files = config.files!;
        let index = Math.max(
            files.findIndex((file) => MOCHA_CORE_PATTERN.test((file as FilePattern).pattern)),
            0
        );

        files.splice(++index, 0, createPattern(__dirname + '/style.css'));
        files.splice(++index, 0, createPattern(__dirname + '/reporter.js'));
    }
}

module.exports = {
    'reporter:kmhtml': ['type', KarmaMochaHtmlReporter]
};