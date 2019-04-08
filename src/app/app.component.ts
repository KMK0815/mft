
import { JsonCompactPipe, mergeObjects } from './jsonlib/json-compact.pipe';
import { Lsm6Data, Lsm6Service } from './lsm6.service';

import { Component, OnInit } from '@angular/core';

import { saveAs } from 'file-saver';
import { OnDestroy } from '@angular/core';
import { Http } from '@angular/http';

import { Subscription } from 'rxjs';

const DEFAULT_CONF =
  `{
	"btn": [0, 0, 0, 0, 0, 0],
	"sw": [1, 1, 1, 1, 1, 1],
	"lsm": {
		"min": [96, 96, 96, 96, 96, 96],
		"max": [254, 254, 254, 254, 254, 254],
		"of": [0, 0, 0, 0, 0, 0],
		"si": [1, 2, 3, 4, 5, 6],
		"dali": [0, 0, 0, 0, 0, 0],
		"sp": [0, 0, 0, 0, 0, 0],
		"sl": [
			[255, 255, 255, 255, 255, 255],
			[255, 255, 255, 255, 255, 255],
			[255, 255, 255, 255, 255, 255],
			[255, 255, 255, 255, 255, 255],
			[255, 255, 255, 255, 255, 255],
			[255, 255, 255, 255, 255, 255]
		]
	},
	"sens": {
		"ls": [-1, -1, -1, -1, -1, -1],
		"lt": [0, 0, 0, 0, 0, 0],
		"ot": [0, 0, 0, 0, 0, 0],
		"ts": [0, 0, 0, 0, 0, 0],
		"mo": [0, 0, 0, 0, 0, 0],
		"pot": [0, 0, 0, 0, 0, 0]
	}
}`;
const TAB_TEXTS: Array<string> = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const IP_ITEMS = [
  { label: 'lsm6' },
  { label: '192.168.0.5' },
  { label: '169.254.123.123' },
];

interface DimmSlider {
  value: number;
}

const sliders: Array<DimmSlider> = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  lsm6Subscription: Subscription;
  stateSubscription: Subscription;
  wsConected = false;
  msg: Lsm6Data = null;
  tab = 0;
  showDetails = false;
  showConnectionData = false;
  wsUrl = 'lsm6';
  wsState = 'Jetzt Verbinden...';
  tabTexts: Array<string>;
  ipItems;
  sliders: Array<DimmSlider>;
  loaded = false;
  imageSrc;
  j = {};
  senonsorOptions = [1, 2, 3, 4, 5, 6];
  sensorSelection = 1;
  offSetvalue = 0;
  minValue = 0;
  maxValue = 0;
  mode_value = 0;
  ready = true;
  customSI = false;
  customOf = false;
  customMinValue = false;
  customMaxValue = false;
  customDil = false;
  tmpSi = [1, 2, 3, 4, 5, 6];
  current_mode: boolean[];
  strData = '';
  copied = false;
  current_config_tab: number;
  tmp = true;
  customPot = 0;
  mode_state = ['Aus', 'Schließer', 'Öffner'];
  current_mode_state = ['Aus', 'Aus', 'Aus', 'Aus', 'Aus', 'Aus'];
  global_state_lm = ['Aus', 'Globaler Sender', 'Globaler Empfänger'];
  current_global_state = ['Aus', 'Aus', 'Aus', 'Aus', 'Aus', 'Aus'];
  transmitting = false;
  constructor(public lsm6Service: Lsm6Service, private http: Http) {
    this.tabTexts = TAB_TEXTS;
    this.sliders = sliders;
    this.ipItems = IP_ITEMS;
  }

  ngOnInit() {
    this.wsUrl = window.location.hostname;
    this.get_data();
  }

  set_curret_config_tab(new_config_tab: number) {


    if (this.current_config_tab !== undefined) {
      if (this.current_config_tab === new_config_tab) {
        this.showDetails = !this.showDetails;
      } else {
        this.current_config_tab = new_config_tab;
        if (!this.showDetails) {
          this.showDetails = true;
        }
      }
    } else {
      this.current_config_tab = new_config_tab;
      this.showDetails = true;
    }

  }
  getDilBinary() {
    if (this.msg) {
      if (this.msg.dil) {
        let tmp = this.msg.dil.toString(2);
        while (tmp.length < 9) {
          tmp = '0' + tmp;
        }
        return tmp;
      }
    }
    return '';
  }
  getPercentage(i: number) {
    const tmp = i.toFixed(2);
    if (tmp === '99.61') {
      return '100';
    } else {
      return tmp;
    }

  }
  changeDil() {
    this.customDil = !this.customDil;
  }
  changeMax() {
    this.customMaxValue = !this.customMaxValue;
    if (!this.customMaxValue) {
      this.msg.lsm.max[this.tab] = 254;
      this.maxValue = 100;
    }
  }
  create_mode(): boolean[] {
    if (this.msg.sens.mo[this.tab] !== undefined) {
      const tmp = this.msg.sens.mo[this.tab].toString(2);
      const res = [];
      for (let i = 0; i < tmp.length; i++) {
        const element = Boolean(Number(tmp[i]));
        res.push(element);
      }
      while (res.length < 8) {
        res.unshift(false);
      }
      this.set_mode_state();
      return res;
    } else {
      return [];
    }
  }
  set_mode_state() {

    if (this.msg.sens.mo[this.tab - 1] === 255) {
      this.current_mode_state[this.tab - 1] = 'Aus';
    } else {
      this.current_mode_state[this.tab - 1] = String(this.current_mode_state[this.tab - 1]);
    }
    // this.current_mode_state.forEach(this.mode_state)
  }
  changeMode() {
    this.msg.sens.mo[this.tab] = 2.55 * this.mode_value;
  }

  changeTab(i: number) {

    this.tab = i;
    this.offSetvalue = this.msg.lsm.of[this.tab];
    this.maxValue = this.msg.lsm.max[this.tab] / 2.54;
    this.minValue = this.msg.lsm.min[this.tab] / 2.54;

    this.sensorSelection = this.msg.lsm.si[this.tab] + 1;
    this.current_mode = this.create_mode();
    this.customPot = this.get_costum_pot();
  }
  refreshMinMax() {
    this.maxValue = this.msg.lsm.max[this.tab] / 2.54;
    this.minValue = this.msg.lsm.min[this.tab] / 2.54;
  }
  ngOnDestroy() {
    this.lsm6Subscription.unsubscribe();
    this.stateSubscription.unsubscribe();
  }
  setSensorChange() {

    this.tmpSi[this.tab] = this.sensorSelection - 1;
    this.msg.lsm.si[this.tab] = this.sensorSelection - 1;
  }
  changeMin() {
    this.customMinValue = !this.customMinValue;
    if (!this.customMinValue) {
      this.msg.lsm.si[this.tab] = 96;
      this.minValue = 96 / 2.54;
    }
  }
  changeOffset() {
    this.customOf = !this.customOf;
  }
  changeSI() {
    this.customSI = !this.customSI;
    if (this.customSI === false) {
      this.sensorSelection = this.tab + 1;
    }
  }
  update() {

  }
  connect() {


    this.lsm6Service.connect(this.wsUrl);

    this.lsm6Subscription = this.lsm6Service.messages.subscribe(
      (message: MessageEvent) => {
        console.log(message.data);
        this.transmitting = false;
        mergeObjects(this.msg, JSON.parse(message.data));
        this.offSetvalue = this.msg.lsm.of[this.tab];
        this.wsState = 'Verbunden';
        this.showConnectionData = false;
        this.wsConected = true;
        this.refreshMinMax();
        if (this.copied) {
          if (this.tmpSi[this.tab] !== this.msg.lsm.si[this.tab] + 1) {
            this.sensorSelection = this.msg.lsm.si[this.tab] + 1;
            this.tmpSi[this.tab] = this.sensorSelection;
          }
        } else {
          this.tmpSi = this.msg.lsm.si;
          this.addIndex();
          this.copied = true;
          this.sensorSelection = this.senonsorOptions[this.msg.lsm.si[this.tab]];
        }
        this.current_mode = this.create_mode();
        this.customPot = this.get_costum_pot();

      }, () => {
        this.lsm6Subscription.unsubscribe();
        this.wsState = 'Verbindung wiederherstellen?';
        this.wsConected = false;
      });
    this.get_data();
  }
  get_costum_pot(): number {
    if (this.msg.sens.pot[this.tab] !== undefined) {
      return Number(((this.msg.sens.pot[this.tab] / 255) * 100).toFixed(2));
    } else {
      return 0;
    }
  }
  get_data() {
    this.http.get('assets/config.json')
      .subscribe(data => {
        if (!this.msg) {
          this.msg = data.json();
          this.loaded = true;
          this.maxValue = this.msg.lsm.max[this.tab] / 2.54;
          this.minValue = this.msg.lsm.min[this.tab] / 2.54;
          this.current_mode = this.create_mode();
        }
      }, error => {
        if (!this.loaded) {
          console.log(DEFAULT_CONF);
          this.msg = JSON.parse(DEFAULT_CONF);
          console.log(error);
          // console.log('config.json konnte nicht geladen werden, verwende standart Werte.\n' + JSON.stringify(DEFAULT_CONF));
          this.loaded = true;
        }
      });
  }

  change_current_mode(index: number) {
    switch (index) {

      case (1): {
        this.handle_selected_global_trigger_state();
        break;
      }
      case (3): {
        this.current_mode[index] = !this.current_mode[index];
        break;
      }
      case (6): {
        this.handle_selected_state();
        break;
      }
      case (7): {
        this.current_mode[index] = !this.current_mode[index];
        break;
      }
      default: {
        this.current_mode[index] = !this.current_mode[index];
        break;
      }
    }
    this.update_mo();
    console.log(this.current_mode);
  }
  get_inverted_mode(index) {
    return !this.current_mode[index];
  }
  handle_selected_global_trigger_state() {
    switch (this.current_global_state[this.tab]) {
      case ('Aus'): {
        this.current_mode[0] = false;
        this.current_mode[1] = false;
        break;
      }
      case ('Globaler Empfänger'): {
        this.current_mode[0] = true;
        this.current_mode[1] = false;
        break;
      }
      case ('Globaler Sender'): {
        this.current_mode[0] = false;
        this.current_mode[1] = true;
      }
    }
  }
  handle_selected_state() {
    switch (this.current_mode_state[this.tab]) {
      // mode_state
      case ('Aus'): {
        this.current_mode[6] = false;
        this.current_mode[5] = false;
        break;
      }
      case ('Schließer'): {
        this.current_mode[6] = true;
        this.current_mode[5] = false;
        break;
      }
      case ('Öffner'): {
        this.current_mode[6] = true;
        this.current_mode[5] = true;
        break;
      }
    }

  }
  get_inverted_state(index) {
    return !this.current_mode[index];
  }
  update_mo() {
    let tmp = 0;
    for (let i = 0; i < this.current_mode.length; i++) {
      if (this.current_mode[i]) {
        tmp += Math.pow(2, 7 - i);
      }
    }
    this.msg.sens.mo[this.tab] = tmp;
  }

  addIndex() {
    this.tmpSi = [];
    this.msg.lsm.si.forEach(value => {
      this.tmpSi.push(value + 1);
    });
  }
  disconnect() {
    this.lsm6Service.closeSocket();
    this.wsConected = false;
    this.copied = false;
  }

  sendObjToLSM6() {
    this.transmitting = true;
    if (this.ready) {
      this.ready = false;
      const s = JSON.stringify(this.j);
      console.log(s);
      this.lsm6Service.send(s);
      this.j = {};
      this.ready = true;
    } else {
      console.log('deadlock');
      console.log(this.ready);
    }

  }

  downloadJsonFile() {
    const jsonString = JsonCompactPipe.prototype.transform(this.msg);
    const file = new Blob([jsonString], { type: 'text/json;charset=utf-8' });
    saveAs(file, 'config.json');
  }
  setOffset(event) {
    this.msg.lsm.of[this.tab] = Math.round(this.offSetvalue * 2.54);
    this.offSetvalue = Number(this.offSetvalue.toFixed(2));
    if (this.wsConected) {
      this.j = this.msg;
      this.sendObjToLSM6();
    }

  }
  uploadJsonFile(e) {
    const file: File = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];

    const pattern = /json/;
    const reader = new FileReader();

    if (!file.name.match(pattern)) {
      alert('invalid format ' + file.name);
      return;
    }

    this.loaded = false;

    reader.onload = this._handleReaderLoaded.bind(this);
    reader.readAsText(file);
  }

  _handleReaderLoaded(e) {
    const reader = e.target;
    this.imageSrc = reader.result;
    this.loaded = true;
    console.log(JSON.stringify(this.msg));
    this.msg = JSON.parse(this.imageSrc);    
  }

  onSelect(msg: Lsm6Data): void {
    this.msg = msg;
  }

  overrunTimeToMsg(newOt: number): void {
    this.msg.sens.ot[this.tab] = (newOt * 60000);
  }

  ifModeNull(mode: boolean): void {
    this.msg.sens.mo[this.tab] = mode ? 1 : 0;
    if (!mode) {
      this.msg.sens.lt[this.tab] = 0;
    }
  }

  getOverrunTimestemp(): string {
    if (this.msg == null || !this.wsConected) {
      return '';
    }
    const ots = (this.msg.sens.ts[this.tab] - this.msg.tic) / 1000;
    if (ots > 180) {
      return 'schalte ab in ' + (ots / 60).toFixed(0) + ' min';
    } else if (ots > 0) {
      return 'schalte ab in ' + ots.toFixed(0) + ' s';
    }
    return 'schalten';
  }
  setMinValue(event) {
    this.msg.lsm.min[this.tab] = 2.54 * event;
  }
  setMaxValue(event) {
    this.msg.lsm.max[this.tab] = 2.54 * event;
  }
  string_to_bool(content: string) {
    return Boolean(Number(content));
  }
  //  refreshSelect(value: any): void {
  ////    this.wsUrl = value;
  //  }
  //
  //  typedSelect(value: any): void {
  //    console.log(value);
  //    this.itemselectors[2] = value;
  //  }
  //
  //  selectedSelect(value: any): void {
  //    this.wsUrl = value;
  //  }
  //
  //  removedSelect(value: any): void {
  //    console.log('removed: ' + value);
  //  }
}
