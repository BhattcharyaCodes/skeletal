import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
//commenting out the expect package
//import expect;
var expect = require('expect'); // v1.15.1

describe('homepage', () => {
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor.ExpectedConditions;
    //var browser_url = browser.get(url);

    beforeAll(async() => {
        browser.waitForAngularEnabled(false);
        await browser.get(url);
    });

    it('should open the google search engine', async() => {
        let wait_urlIs =  await browser.wait(EC.urlIs(url), 5000);
        expect(browser.get(url)).toBe(wait_urlIs); 
    });

    // it('should search for the input text',async() => {
    //     var search_box_locator = "input[class='gLFyf gsfi']";
    //     let search_box = await $(search_box_locator);
    //     search_box.sendKeys(search_text, protractor.Key.ENTER, protractor.Key.NULL);
    //    // expect(search_text).toEqual(await search_box.getText());
    //     let res = await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
    //     expect(res).toBeTruthy();
    // });

    // xit('should be able to navigate to the first search result', async() => {

    // });

});


