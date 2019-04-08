import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { Lsm6Service } from './lsm6.service';
import { DimmPipe } from './gui/dimm-slider/dimm.pipe';
import { DimmSliderComponent } from './gui/dimm-slider/dimm-slider.component';
import { JsonCompactPipe } from './jsonlib/json-compact.pipe';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    DimmPipe,
    DimmSliderComponent,
    JsonCompactPipe,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgSelectModule,
    MatSelectModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
  ],
  providers: [Lsm6Service],
  bootstrap: [AppComponent]
})
export class AppModule { }