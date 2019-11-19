import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
import { elementsLocated } from 'selenium-webdriver/lib/until';
import { Homepage_page_object } from '../page-objects/path.homepage.page';

describe('homepage', () => {
    let hmp = new Homepage_page_object();
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor.ExpectedConditions;
    beforeAll(async() => {
        //debugger;
        await browser.get(url);
    });

    it('should open the google search engine', async() => {
        // let wait_urlIs =  await browser.wait(EC.urlIs(url), 10000);
        // debugger;
        expect(await browser.getCurrentUrl()).toEqual(url);
    });

    it('should load the google logo image', async() => {
        expect(await hmp.google_img.isPresent()).toBeTruthy();
    });

    it('should contain the "Feeling lucky button"', async() => {
        expect( hmp.feeling_lucky_button.isPresent()).toBeTruthy();
    });

    it('should contain the  "Google Search" button', async() => {
        expect(await hmp.google_search_button.isPresent()).toBeTruthy();
    });

    it('should search for the input text', async() => {
        await hmp.input_box.sendKeys(search_text,protractor.Key.ENTER,protractor.Key.NULL);
        expect(await hmp.result_string.isPresent()).toBeTruthy();
    });

    // it('should should not search anything if input belongs to {'',!, @, $,#}', async() => {
      //  let expected_string: string = "Your search - !,@,#,$ - did not match any documents.";

    // });

    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should have Minimum lengths be set to 1 for the input boxes', async() => {

    // });
    // it('should have a Maximum lengths of word char for the input boxes', async() => {
     
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

});


