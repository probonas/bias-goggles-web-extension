import { extension } from "../src/ts/storage";
import { userSettings } from "../src/ts/usersettings";
import { alexatop300gr } from "./domains";
import { utils } from "../src/ts/utils";
import { Goggle } from "../src/ts/types";

let defaultGoggles: Goggle[];

describe('mockUsage', () => {

    beforeAll((done) => {
        chrome.storage.local.clear(() => {
            userSettings.initialize(() => {
                userSettings.get((items) => {
                    defaultGoggles = items.gogglesList;
                    done();
                });
            });
        });
    });

    beforeEach((done) => {
        jasmine.clock().install();
        done();
    });

    afterEach((done) => {
        jasmine.clock().uninstall();
        done();
    });

    for (let i = 1; i < 30; i++) {

        for (let domain = 0; domain < alexatop300gr.length / 50; domain++) {

            for (let total = 0; total < Math.floor(Math.random() * 20); total++) {

                it('day ' + i, (done) => {

                    console.error('day ' + i);

                    jasmine.clock().mockDate(new Date(2020, 1, i));
                    let completed = new Array<String>();

                    for (let g = 0; g < defaultGoggles.length; g++) {
                        extension.storage.getLatestScoreData(utils.getDomainFromURL(alexatop300gr[domain]),
                            defaultGoggles[g].id, (score, index) => {
                                expect().nothing();
                                completed.push(defaultGoggles[g].id);
                                if (completed.length === defaultGoggles.length)
                                    done();
                            });
                    }

                });
            }
        }
    }


});