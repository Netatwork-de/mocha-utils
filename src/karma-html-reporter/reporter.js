/* eslint-disable @typescript-eslint/explicit-function-return-type */
// @ts-check

// Note: As this file is directly served in the browser, this is intentionally written in JavaScript, and devoid of any external deps.
try {

    /**
     * @typedef {Window & { mocha: Mocha; Mocha: typeof Mocha }} MochaWindow
     */
    const windw = ( /** @type {MochaWindow} */( /** @type {unknown} */(window)));
    const {
        EVENT_RUN_END,
        EVENT_SUITE_BEGIN,
        EVENT_SUITE_END,
        EVENT_TEST_FAIL,
        EVENT_TEST_PASS,
        EVENT_TEST_PENDING,
    } = windw.Mocha.Runner.constants;

    /** @type {typeof import('mocha').reporters.Base} */
    let OriginalReporterFunction;

    /**
     *
     *
     * @class MochaReporter
     */
    class MochaReporter {
        /** @type {import('mocha').reporters.Base} */
        _originalReporter;
        /** @type {HTMLDivElement | undefined} */
        dots;
        /** @type {HTMLDivElement | undefined} */
        summary;
        /** @type {HTMLUListElement | undefined} */
        specs;

        /**
         * @param {import('mocha').Runner} runner
         */
        constructor(runner) {
            // this will retain the original reporter functionality as well.
            this._originalReporter = new OriginalReporterFunction(runner);
            const container = this.createResultContainer();
            if (container === null) { return; }

            let currentSuiteContainer = /** @type {HTMLUListElement} */ (this.specs);

            runner
                .on(EVENT_SUITE_BEGIN, (suite) => {
                    if (suite.root) { return; }
                    const item = this.createListItem(suite.title);
                    const list = document.createElement('ul');
                    item.appendChild(list);
                    currentSuiteContainer.appendChild(item);
                    currentSuiteContainer = list;
                })
                .on(EVENT_SUITE_END, () => {
                    currentSuiteContainer = /** @type {HTMLUListElement} */ (currentSuiteContainer.parentElement);
                })
                .on(EVENT_TEST_PASS, /** @param {import('mocha').Test} test */(test) => {
                    this.append(test, currentSuiteContainer);
                })
                .on(EVENT_TEST_PENDING, /** @param {import('mocha').Test} test */(test) => {
                    this.append(test, currentSuiteContainer);
                })
                .on(EVENT_TEST_FAIL, /** @param {import('mocha').Test} test */(test, error) => {
                    this.append(test, currentSuiteContainer, error);
                })
                .once(EVENT_RUN_END, () => {
                    const stats = /** @type {Mocha.Stats} */ (runner.stats);
                    const span = document.createElement('span');
                    const numFailures = stats.failures ?? 0;
                    span.textContent = (numFailures > 0 ? numFailures + ' failures. ' : '')
                        + stats.passes
                        + ' of '
                        + stats.tests
                        + ' tests passed.'
                        + ((stats.pending ?? 0) > 0 ? ' ' + stats.pending + ' pending.' : '');
                    const time = document.createElement('span');
                    time.textContent = `Finished in ${(stats?.duration || 0) / 1000} s`;
                    const summary = /** @type {HTMLDivElement} */ (this.summary);
                    summary.append(span, time);
                    summary.dataset[numFailures ? 'failure' : 'success'] = '';
                    const ulDiv = document.createElement('div');
                    ulDiv.classList.add('ul-container');
                    ulDiv.append(/** @type {HTMLUListElement} */(this.specs));
                    container.append(
                        /** @type {HTMLDivElement} */(summary),
                        ulDiv
                    );
                });
        }

        /**
         * @returns {(HTMLDivElement | null)}
         */
        createResultContainer() {
            try {
                const container = document.createElement('div');
                container.classList.add('kmhtml');
                const dots = this.dots = document.createElement('div');
                dots.classList.add('dots');
                this.summary = document.createElement('div');
                this.summary.classList.add('summary');
                this.specs = document.createElement('ul');
                container.appendChild(dots);
                document.body.appendChild(container);
                return container;
            } catch (e) {
                return null;
            }
        }

        /**
         * @param {import('mocha').Test} test
         * @param {HTMLUListElement} suiteContainer
         * @param {Error | undefined} error
         */
        append(
            test,
            suiteContainer,
            error = undefined,
        ) {
            let $class = '';
            switch (true) {
                case test.isPassed():
                    $class = 'passed';
                    break;
                case test.isFailed():
                    $class = 'failed';
                    break;
                case test.isPending():
                    $class = 'pending';
                    break;
            }

            const title = test.fullTitle();
            const span = document.createElement('span');
            span.innerHTML = '&bull;';
            span.title = title;
            span.classList.add($class, 'dot');
            span.style.color = $class;

            (/** @type {HTMLDivElement} */(this.dots)).appendChild(span);
            suiteContainer.appendChild(this.createSpecResult(test, $class, error));
        }

        /**
         * @param {import('mocha').Test} test
         * @param {string} [$class='']
         * @param {Error | undefined} error
         * @returns {HTMLLIElement}
         */
        createSpecResult(
            test,
            $class = '',
            error = undefined,
        ) {
            const li = this.createListItem(test.title, test.fullTitle(), $class);

            if (test.isFailed()) {
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.textContent = 'Error(s)';
                details.append(summary);

                const errDiv = document.createElement('pre');
                const err = /** @type {Error} */(error);
                errDiv.innerHTML = err.message + '\n' + err.stack;
                details.append(errDiv);
                li.append(details);
            }

            return li;
        }

        /**
         * @param {string} title
         * @param {string} [fullTitle=title]
         * @param {string} [$class='']
         */
        createListItem(title, fullTitle = title, $class = '') {
            const li = document.createElement('li');
            if ($class) {
                li.classList.add($class);
            }

            const anchor = document.createElement('a');
            anchor.innerText = title;
            const loc = new URL(location.href);
            loc.pathname = 'debug.html';
            loc.searchParams.set('grep', fullTitle);
            anchor.href = loc.href;
            anchor.target = '_blank';

            li.appendChild(anchor);
            return li;
        }
    }

    const mocha = windw.mocha;
    OriginalReporterFunction = /** @type {typeof import('mocha').reporters.Base} */ (mocha['_reporter']);
    mocha['_reporter'] = MochaReporter;
} catch (e) {
    console.log('Not running the kmhtml reporter. Note that this is a dev-only reporter, meant to be used in browser.');
}