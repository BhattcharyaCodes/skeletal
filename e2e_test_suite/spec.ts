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
        await $('input.gLFyf').sendKeys(search_text, protractor.Key.ENTER, protractor.Key.NULL);
        let result_string = element(by.id('resultStats')).isPresent();
        expect(result_string).toBeTruthy();
    });

    // it('should should not search anything if input belongs to {'',!, @, $,#}', async() => {
      //  let expected_string: string = "Your search - !,@,#,$ - did not match any documents.";

    // });

    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should have Minimum lengths be set to 1 for the input boxes', async() => {

    // });
    // it('should have a Maximum lengths of word char for the input boxes', async() => {
        let locator_aria_label: string = 'gLFyf gsfi';
        let maximum_len:string = '2048'; //maxlength attribute name for input
        
    // });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should contain the horizotnal navigation bar to group the search results', async() => {
// let top_nav_bar = $(div#top_nav));
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


