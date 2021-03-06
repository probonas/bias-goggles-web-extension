import { extension } from "../src/ts/storage";
import { userSettings } from "../src/ts/usersettings";
import { alexatop300gr } from "./domains";
import { PoliticalParties, SportsTeams } from "../src/ts/types";
import { utils } from "../src/ts/utils";

describe('mockUsage', () => {

    beforeAll((done) => {
        chrome.storage.local.clear(() => {
            userSettings.initialize(done);
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

                    extension.storage.getLatestScoreData(utils.getDomainFromURL(alexatop300gr[domain]),
                        PoliticalParties.id, (score, index) => {
                            
                            extension.storage.getLatestScoreData(utils.getDomainFromURL(alexatop300gr[domain]),
                                SportsTeams.id, (score, index) => {
                                    expect().nothing();
                                    done();
                                });
                                
                        });


                });
            }
        }
    }


});