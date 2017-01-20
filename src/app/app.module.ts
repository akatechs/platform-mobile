import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Storage } from '@ionic/storage';

import 'reflect-metadata';
import { LazyLoadImageModule } from 'ng2-lazyload-image';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { DeploymentAddPage } from '../pages/deployment-add/deployment-add';
import { DeploymentLoginPage } from '../pages/deployment-login/deployment-login';
import { DeploymentDetailsPage } from '../pages/deployment-details/deployment-details';

import { ResponseListPage } from '../pages/response-list/response-list';
import { ResponseDetailsPage } from '../pages/response-details/response-details';
import { ResponseAddPage } from '../pages/response-add/response-add';
import { ResponseEditPage } from '../pages/response-edit/response-edit';
import { ResponseMapPage } from '../pages/response-map/response-map';
import { ResponseSearchPage } from '../pages/response-search/response-search';

import { CheckboxComponent } from '../components/checkbox/checkbox';
import { CheckboxesComponent } from '../components/checkboxes/checkboxes';
import { DateComponent } from '../components/date/date';
import { DateTimeComponent } from '../components/datetime/datetime';
import { ImageComponent } from '../components/image/image';
import { LocationComponent } from '../components/location/location';
import { NumberComponent } from '../components/number/number';
import { RadioComponent } from '../components/radio/radio';
import { SelectComponent } from '../components/select/select';
import { TextComponent } from '../components/text/text';
import { TextAreaComponent } from '../components/textarea/textarea';
import { VideoComponent } from '../components/video/video';

import { CardComponent } from '../components/card/card';
import { ValueComponent } from '../components/value/value';

import { DateTimePipe } from '../pipes/date-time';
import { TimeAgoPipe } from '../pipes/time-ago';
import { TitleizePipe } from '../pipes/titleize';
import { CapitalizePipe } from '../pipes/capitalize';

import { LoggerService } from '../providers/logger-service';
import { ApiService } from '../providers/api-service';
import { DatabaseService } from '../providers/database-service';

export function provideStorage() {
  return new Storage(['sqlite', 'websql', 'indexeddb'], { name: 'ushahidi' });
}

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    DeploymentAddPage,
    DeploymentLoginPage,
    DeploymentDetailsPage,
    ResponseListPage,
    ResponseDetailsPage,
    ResponseAddPage,
    ResponseEditPage,
    ResponseMapPage,
    ResponseSearchPage,
    CheckboxComponent,
    CheckboxesComponent,
    DateComponent,
    DateTimeComponent,
    ImageComponent,
    LocationComponent,
    NumberComponent,
    RadioComponent,
    SelectComponent,
    TextComponent,
    TextAreaComponent,
    VideoComponent,
    CardComponent,
    ValueComponent,
    DateTimePipe,
    TimeAgoPipe,
    TitleizePipe,
    CapitalizePipe
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    ReactiveFormsModule,
    LazyLoadImageModule
  ],
  bootstrap: [ IonicApp ],
  entryComponents: [
    MyApp,
    HomePage,
    DeploymentAddPage,
    DeploymentLoginPage,
    DeploymentDetailsPage,
    ResponseListPage,
    ResponseDetailsPage,
    ResponseAddPage,
    ResponseEditPage,
    ResponseMapPage,
    ResponseSearchPage
  ],
  providers: [
    { provide: Storage, useFactory: provideStorage },
    { provide: ApiService, useClass: ApiService },
    { provide: LoggerService, useClass: LoggerService },
    { provide: DatabaseService, useClass: DatabaseService },
    { provide: ErrorHandler, useClass: IonicErrorHandler } ]
})
export class AppModule {}
