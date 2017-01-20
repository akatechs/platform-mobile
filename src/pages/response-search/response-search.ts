import { Component, ViewChild } from '@angular/core';
import { Platform, NavParams, Searchbar,
  NavController, ViewController, LoadingController, ToastController, AlertController, ModalController, ActionSheetController } from 'ionic-angular';

import { BasePage } from '../../pages/base-page/base-page';

import { Deployment } from '../../models/deployment';
import { Filter } from '../../models/filter';
import { Form } from '../../models/form';

import { ApiService } from '../../providers/api-service';
import { LoggerService } from '../../providers/logger-service';
import { DatabaseService } from '../../providers/database-service';

@Component({
  selector: 'page-response-search',
  templateUrl: 'response-search.html',
  providers: [ ApiService, DatabaseService, LoggerService ]
})
export class ResponseSearchPage extends BasePage {

  deployment: Deployment = null;
  filter: Filter = null;
  forms: Form[] = null;


  @ViewChild('searchbar')
  searchbar: Searchbar;

  constructor(
    public platform:Platform,
    public api:ApiService,
    public logger:LoggerService,
    public database:DatabaseService,
    public navParams: NavParams,
    public navController:NavController,
    public viewController:ViewController,
    public modalController:ModalController,
    public toastController:ToastController,
    public alertController:AlertController,
    public loadingController:LoadingController,
    public actionController:ActionSheetController) {
      super(navController, viewController, modalController, toastController, alertController, loadingController, actionController);
  }

  ionViewDidLoad() {
    this.logger.info(this, 'ionViewDidLoad');
  }

  ionViewWillEnter() {
    this.logger.info(this, "ionViewWillEnter");
    this.deployment = <Deployment>this.navParams.get("deployment");
    this.forms = <Form[]>this.navParams.get("forms");
    this.filter = <Filter>this.navParams.get("filter");
    if (this.filter == null) {
      this.filter = new Filter();
      this.filter.deployment_id = this.deployment.id;
      this.filter.search_text = null;
      this.filter.show_inreview = true;
      this.filter.show_archived = true;
      this.filter.show_published = true;
      this.filter.show_forms = this.forms.map((form:Form) => form.id).join(",");
    }
    this.logger.info(this, "ionViewWillEnter", "Filter", this.filter);
  }

  ionViewDidEnter() {
    this.logger.info(this, "ionViewDidEnter");
  }

  onCancel(event:any) {
    this.logger.info(this, "onCancel");
    this.hideModal();
  }

  onDone(event:any) {
    this.logger.info(this, "onDone");
    this.database.saveFilter(this.deployment, this.filter).then(results => {
      this.hideModal({
        filter: this.filter });
    });
  }

  onSearch(event:any) {
    this.logger.info(this, "onSearch");
  }

  formChanged(event:any, form:Form) {
    if (event.checked) {
      this.logger.info(this, "formChanged", "Checked", form.id);
      this.filter.addForm(form);
    }
    else {
      this.logger.info(this, "formChanged", "Unchecked", form.id);
      this.filter.removeForm(form);
    }
  }

  publishedChanged(event:any) {
    this.logger.info(this, "publishedChanged");
  }

  reviewChanged(event:any) {
    this.logger.info(this, "reviewChanged");
  }

  archivedChanged(event:any) {
    this.logger.info(this, "archivedChanged");
  }
}
