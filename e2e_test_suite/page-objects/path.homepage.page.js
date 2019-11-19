"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
class Homepage_page_object {
    constructor() {
        this.input_box = protractor_1.$('input.gLFyf');
        this.google_img = protractor_1.element(protractor_1.by.id('hplogo'));
        this.feeling_lucky_button = protractor_1.element.all(protractor_1.by.css('input.RNmpXc[type="submit"]')).first();
        this.google_search_button = protractor_1.$('input.gNO89b[value="Google Search"]');
        this.result_string = protractor_1.element(protractor_1.by.id('resultStats'));
    }
}
exports.Homepage_page_object = Homepage_page_object;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5ob21lcGFnZS5wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGF0aC5ob21lcGFnZS5wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTZGO0FBRzdGLE1BQWEsb0JBQW9CO0lBQWpDO1FBQ0ksY0FBUyxHQUFHLGNBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QixlQUFVLEdBQUcsb0JBQU8sQ0FBQyxlQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDdEMseUJBQW9CLEdBQUcsb0JBQU8sQ0FBQyxHQUFHLENBQUMsZUFBRSxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbEYseUJBQW9CLEdBQUksY0FBQyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDakUsa0JBQWEsR0FBRyxvQkFBTyxDQUFDLGVBQUUsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUVsRCxDQUFDO0NBQUE7QUFSRCxvREFRQyJ9