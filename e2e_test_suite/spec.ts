"use strict";
import { browser, element, by, By, $, $$, ExpectedConditions } from 'protractor';
import expect from 'expect' ;
//import {'element', 'Elements', $, $$, Keys} from 'protractor'
//import * from 'protractor';
//export * from "protractor" ;
describe('homepage', () => {

    beforeEach(async() => {
        browser.waitForAngularEnabled(false);
        let url = 'https://www.google.com/';
        await browser.get(url);
        let search_text = 'gibberish';
    });

    it('should open the google search engine', function(){
        let ec = protractor.ExpectedConditions;
        console.log(expect(await browser.wait(ec.urlIs(), 5000)).toEqual(url));
    });

    it('should search for the input text',function(){
    await element(by.className('gLFyf gsfi')).sendKeys(search_text);
    expect.(search_text)toEqual();
        //browser.actions().sendKeys(protractor.Keys.ENTER).perform();

    });

    it('should be able to navigate to the first search result', async() => {

    });

});


