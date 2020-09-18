import mocha from 'mocha';
import MochaJUnitReporter from 'mocha-junit-reporter';

class JunitSpecReporter extends mocha.reporters.Base {

    private readonly junitReporter: MochaJUnitReporter;
    private readonly specReporter: mocha.reporters.Spec;
    constructor(runner: mocha.Runner, options: mocha.MochaOptions) {
        super(runner, options);
        this.junitReporter = new MochaJUnitReporter(runner, options);
        this.specReporter = new mocha.reporters.Spec(runner, options);
    }
}
// this is needed as this needs to be only export from this file. otherwise mocha cannot make sense of it
export = JunitSpecReporter;