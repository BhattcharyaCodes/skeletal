"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
class Homepage_page_object {
    constructor() {
        this.input_box = protractor_1.$('input.gLFyf');
        this.google_img = protractor_1.element(protractor_1.by.id('hplogo'));
        //locator_aria_label: string = 'gLFyf gsfi';
        this.feeling_lucky_button = protractor_1.$('input.RNmpXc[type=submit]');
        this.google_search_button = protractor_1.$('input.gNO89b[value="Google Search"]');
        this.result_string = protractor_1.element(protractor_1.by.id('resultStats'));
        this.maximum_len = '2048'; //maxlength attribute name for input
    }
}
exports.Homepage_page_object = Homepage_page_object;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5ob21lcGFnZS5wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGF0aC5ob21lcGFnZS5wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTZGO0FBRzdGLE1BQWEsb0JBQW9CO0lBQWpDO1FBQ0ksY0FBUyxHQUFHLGNBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QixlQUFVLEdBQUcsb0JBQU8sQ0FBQyxlQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDdEMsNENBQTRDO1FBQzVDLHlCQUFvQixHQUFHLGNBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ3RELHlCQUFvQixHQUFJLGNBQUMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ2pFLGtCQUFhLEdBQUcsb0JBQU8sQ0FBQyxlQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDOUMsZ0JBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxvQ0FBb0M7SUFFOUQsQ0FBQztDQUFBO0FBVEQsb0RBU0MifQ==