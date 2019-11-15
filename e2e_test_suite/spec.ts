import { browser, element, by, By, $, $$, ExpectedConditions } from 'protractor';
import expect from 'expect' ;
describe('homepage', () => {
    let search_text = 'gibberish';
    let url = 'https://www.google.com/';
    let EC = protractor.ExpectedConditions;


    beforeEach(async() => {
        browser.waitForAngularEnabled(false);
        await browser.get(url);

    });

    it('should open the google search engine', async() => {
        expect(await browser.wait(EC.urlIs(), 5000)).toEqual(url);
    });

    it('should search for the input text',async() => {
        var search_box = await element(by.css('gLFyf gsfi'))
        search_box.sendKeys(search_text);
       // expect(search_text).toEqual(await search_box.getText());
        let res = await browser.wait(EC.textToBePresentInElement(search_box, search_text), 8000);
        expect(res).toBeTruthy();
    });

    xit('should be able to navigate to the first search result', async() => {

    });

});


