import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
import { elementsLocated } from 'selenium-webdriver/lib/until';
import { Homepage_page_object } from '../page-objects/path.homepage.page'; //refactor
import {Test_data_declarations} from '../constants'; //refactor
import {SearchResultPage} from '../page-objects/path.search_result.page';

describe('homepage', () => {
    let hmp = new Homepage_page_object(); //refactor
    let test_data = new Test_data_declarations(); //refactor
    let srp = new SearchResultPage();
    let EC = protractor.ExpectedConditions;
    beforeAll(async () => {
        await browser.get(test_data.google_home_page_url);
    });

    it('should open the google search engine & load the google logo image in ther center of the page', () => {
        expect(browser.getCurrentUrl()).toEqual(test_data.google_home_page_url);
        expect(hmp.google_img.isPresent()).toBeTruthy();
        expect(hmp.google_img.getAttribute('style')).toEqual(test_data.google_img_style);
       
    });

    // xit('should contain the "Feeling lucky button" and clicking it takes you to doodle url', async() => {
    //     expect(  hmp.feeling_lucky_button.isElementPresent()).toBeTruthy();
    //     await hmp.feeling_lucky_button.click();
    //     expect(await browser.getCurrentUrl()).toEqual(test_data.doodle_url);
    // });

    it('should contain the  "Google Search" button', () => {
        expect(hmp.google_search_button.isPresent()).toBeTruthy();
    });

    it('should search for the input text', async() => {
        await hmp.input_box.sendKeys(test_data.search_text,protractor.Key.ENTER,protractor.Key.NULL);
        expect(hmp.result_string.isPresent()).toBeTruthy();
        //merging with should contain the horizotnal navigation bar to group the search results
        expect(srp.top_nav_bar.isPresent()).toBeTruthy();
        await hmp.input_box.clear();
        
    });

    it("should should not search anything if input belongs to '',!, @, $,# or is blank", async() => {
        await hmp.input_box.sendKeys(test_data.invalid_entries[0], protractor.Key.ENTER, protractor.Key.NULL);
        debugger;
        expect(srp.unmatched_search_msg.isPresent()).toBeTruthy();
        //invalid_inputs .toEqual(expected_string);
        //console.log(srp.unmatched_search_msg.getText());
        expect(srp.unmatched_search_msg.getText()).toEqual(test_data.expected_string);
           
    });

    it('should be able to navigate to the first search result', async() => {
        //if condition to check if the search has returned a non-empty list 
        //locate the first element of the search list
        //.click() on the nth element form the search  list
        //


        });


    it('should have a Maximum lengths of word char for the input boxes', async() => {
     expect(await hmp.input_box.getAttribute('maxlength')).toEqual(test_data.maximum_len);
    });

    //search list page 
    xit('should be able to navigate to the first search result', async() => {

    });
    
    it('should not crash the Application, if user inserted % in search field', async() => {
        await hmp.input_box.sendKeys(test_data.invalid_entries[3], protractor.Key.ENTER, protractor.Key.NULL);
        expect(await hmp.result_string.isPresent()).toBeTruthy();
        //expect();

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

});


