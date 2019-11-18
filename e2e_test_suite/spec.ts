import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
//commenting out the expect package
//import expect;
//var expect = require('expect'); // v1.15.1

describe('homepage', () => {
    
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor.ExpectedConditions;
    // let browser_url: any;
    beforeAll(async() => {
        browser.waitForAngularEnabled(false);
        debugger;
        await browser.get(url);
    });

    it('should open the google search engine', async() => {
        // let wait_urlIs =  await browser.wait(EC.urlIs(url), 10000);
       // expect(url).toBe(wait_urlIs); 
        // debugger;
        expect(browser.getCurrentUrl()).toEqual(url);
    });

    it('should load the google logo image', async() => {
        let google_img = element(by.id('hplogo'));
        expect(google_img.isPresent()).toBeTruthy();
    });

    it('should search for the input text', async() => {
        var search_box_locator = "input.['gLFyf gsfi']";
        let search_box = await $(search_box_locator);
        search_box.sendKeys(search_text, protractor.Key.ENTER, protractor.Key.NULL);
        //let res = 
        // await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
        expect(await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000)).toBeTruthy();
    });

    // it('should be able to navigate to the first search result', async() => {

    // });

    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });

});


