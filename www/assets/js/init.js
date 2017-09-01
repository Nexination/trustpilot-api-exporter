"use strict";
class DataBridge {
  constructor() {
    this.settings = {};
    this.timers = {};
    this.domStore = {
      "inputLoader": document.getElementById('inputLoader')
    };
    
    this.querySend('GET', '/api/v1/settings', '', (restQuery) => {this.settingsLoad(restQuery);});
  }
  querySend(method, endpoint, data, callback) {
    let restQuery = new XMLHttpRequest();
    restQuery.onreadystatechange = () => {callback(restQuery)};
    restQuery.open(method, endpoint, true);
    restQuery.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    restQuery.setRequestHeader("Content-type", "application/json");
    restQuery.send(data);
    return restQuery;
  }
  settingsLoad(restQuery) {
    if(restQuery.readyState === 4 && restQuery.status === 200){
      this.settings = JSON.parse(restQuery.responseText);
      this.domUpdate();
    };
  }
  settingsSave(event) {
    let target = event.target || event.srcElement;
    //target.innerHTML = 'Save';
    this.querySend('POST', '/api/v1/settings', JSON.stringify(this.settings), this.void);
    this.inputLoader('load');
    
    return false;
  }
  exportRun(event) {
    let target = event.target || event.srcElement;
    //target.innerHTML = 'Save';
    this.querySend('GET', '/api/v1/export', '', this.void);
    //this.inputLoader('load');
    
    return false;
  }
  inputLoader(action) {
    console.log(action);
    if(action === 'load') {
      console.log(document.getElementById('inputLoader'));
      this.domStore.inputLoader.style.display = '';
      setTimeout(() => {this.inputLoader('unload');}, 2000);
    }
    else if(action === 'unload') {
      this.domStore.inputLoader.style.display = 'none';
    };
  }
  objectUpdate(event) {
    let target = event.target || event.srcElement;
    this.settings[target.name] = target.value;
  }
  domUpdate() {
    let domTemplate = document.getElementById('inputTemplate');
    let parent = domTemplate.parentElement;
    for(let i in this.settings) {
      let clone = domTemplate.cloneNode(true);
      clone.style.display = '';
      clone.id = '';
      
      clone.getElementsByTagName('span')[0].innerHTML = i;
      
      let input = clone.getElementsByTagName('input')[0];
      input.name = i;
      input.value = this.settings[i];
      input.addEventListener("keyup", (event) => {this.objectUpdate(event);});
      
      parent.insertBefore(clone, domTemplate);
      //parent.appendChild(clone);
    };
  }
  void() {
    return null;
  }
};
let dataBridge = new DataBridge();