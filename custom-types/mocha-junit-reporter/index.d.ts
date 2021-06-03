declare module 'mocha-junit-reporter' {
    import mocha from 'mocha';
    export default class MochaJUnitReporter extends mocha.reporters.Base { }
}
