import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';
import { Homepage_page_object } from '../page-objects/path.homepage.page'; //refactor
import {Test_data_declarations} from '../constants'; //refactor
import {SearchResultPage} from '../page-objects/path.search_result.page';

describe('homepage', () => {
    let homepage = new Homepage_page_object(); //refactor
    let test_data = new Test_data_declarations(); //refactor
    let srp = new SearchResultPage();
    let EC = protractor.ExpectedConditions;
    beforeEach(async () => {
        await browser.get(test_data.google_home_page_url);
    });

    it('should open the google search engine & load the google logo image in ther center of the page', () => {
        expect(browser.getCurrentUrl()).toEqual(test_data.google_home_page_url);
        expect(homepage.google_img.isPresent()).toBeTruthy();
        expect(homepage.google_img.getAttribute('style')).toEqual(test_data.google_img_style);
       
    });

    it('should be able to select the voice search option', () => {
        expect(homepage.voice_search_icon.isPresent()).toBeTruthy();
        homepage.voice_search_icon.click();
        //advance : check the search message that comes onmouseover event of this button
    });

    it('should contain the  "Google Search" button', () => {
        expect(homepage.google_search_button.isPresent()).toBeTruthy();
    });

    it('should contain the "Feeling lucky button" and clicking it takes you to doodle url', async() => {
        expect( homepage.feeling_lucky_button.isPresent()).toBeTruthy();
        await homepage.feeling_lucky_button.submit();
        await browser.manage().timeouts().pageLoadTimeout(5000);
       //ElementNotVisibleError:
        expect( browser.getCurrentUrl()).toEqual(test_data.doodle_url);
    });
    
    it("should should not search anything if input belongs to '',!, @, $,# or is blank", async() => {
        await homepage.input_box.sendKeys(test_data.invalid_entries[0], protractor.Key.ENTER, protractor.Key.NULL);
        debugger;
        expect(srp.unmatched_search_msg.isPresent()).toBeTruthy();
        expect(srp.unmatched_search_msg.getText()).toEqual(test_data.expected_string);
        await homepage.input_box.clear();  
    });

    it('should not crash the Application, if user inserted % in search field', async() => {
        await homepage.input_box.sendKeys(test_data.invalid_entries[3], protractor.Key.ENTER, protractor.Key.NULL);
        expect(await homepage.result_string.isPresent()).toBeTruthy();
        await homepage.input_box.clear();

    }); 

    it('should have a Maximum lengths of word char for the input boxes', async() => {
        expect(await homepage.input_box.getAttribute('maxlength')).toEqual(test_data.maximum_len);
    });

    it('should search for the input text', async() => {
        await homepage.input_box.sendKeys(test_data.search_text,protractor.Key.ENTER,protractor.Key.NULL);
        expect(homepage.result_string.isPresent()).toBeTruthy();
        expect(srp.top_nav_bar.isPresent()).toBeTruthy();
        await homepage.input_box.clear();
        
    });

    it('should be able to navigate to the first search result', async() => {
        //if condition to check if the search has returned a non-empty list 

        //locate the first element of the search list
        //.click() on the nth element form the search  list
        });

    //search list page 
    it('should be able to load the image result which can be clicked', async() => {
            expect(homepage.image_tab_locator.isPresent()).toBeTruthy();
            await homepage.image_tab_locator.click();
           // expect(homepage.image_result_list.isPresent()).toBeTruthy();

    });
    
    // it('should be able to load the video result which can be clicked', async() => {

    // });
    it('should be able to suggest auto complete when the user start typing word in text box which matches typed keyword', async() => {
        //check f auto complete comes up at all
        //need to match the auto result with the input text
        
    });
    it('should be able to navigate back to the initial search result', async() => {

    });
    it('should be able to load searchistory  after clicking Search field', async() => {

    });
    it('should be able to navigate to the different paginated search result', async() => {

    });
    it('should be display the total number of first search result', async() => {

    });
    // it('should be able to navigate to the first search result', async() => {

    // });
    // it('should be able to navigate to the first search result', async() => {

    // });

});


