import { Component, NgZone } from '@angular/core';
import { Platform, NavParams, Events,
  NavController, ViewController, LoadingController, ToastController, AlertController, ModalController, ActionSheetController } from 'ionic-angular';
import { SebmGoogleMap, SebmGoogleMapMarker, SebmGoogleMapInfoWindow, LatLngBounds, MapsAPILoader } from 'angular2-google-maps/core';

import { BasePage } from '../../pages/base-page/base-page';
import { ResponseAddPage } from '../response-add/response-add';
import { ResponseDetailsPage } from '../response-details/response-details';
import { ResponseSearchPage } from '../response-search/response-search';

import { CardComponent } from '../../components/card/card';

import { ApiService } from '../../providers/api-service';
import { LoggerService } from '../../providers/logger-service';
import { DatabaseService } from '../../providers/database-service';

import { Deployment } from '../../models/deployment';
import { Post } from '../../models/post';
import { Form } from '../../models/form';
import { Image } from '../../models/image';
import { Value } from '../../models/value';
import { Attribute } from '../../models/attribute';
import { Filter } from '../../models/filter';
import { Collection } from '../../models/collection';

declare var google: any;

@Component({
  selector: 'page-response-list',
  templateUrl: 'response-list.html',
  providers: [ ApiService, DatabaseService, LoggerService ],
  entryComponents:[ ResponseAddPage, ResponseDetailsPage, ResponseSearchPage ]
})
export class ResponseListPage extends BasePage {

  deployment: Deployment = null;
  posts: Post[] = null;
  filtered: Post[] = null;
  filter: Filter = null;
  view: string = 'list';
  mapDraggable: boolean = true;
  zoomControl : boolean = false;
  disableDefaultUI : boolean = true;
  latLngBounds: LatLngBounds = null;

  constructor(
    private mapsAPILoader:MapsAPILoader,
    public api:ApiService,
    public logger:LoggerService,
    public database:DatabaseService,
    public events:Events,
    public navParams:NavParams,
    public zone: NgZone,
    public platform:Platform,
    public navController:NavController,
    public viewController:ViewController,
    public modalController:ModalController,
    public toastController:ToastController,
    public alertController:AlertController,
    public loadingController:LoadingController,
    public actionController:ActionSheetController) {
      super(zone, platform, navController, viewController, modalController, toastController, alertController, loadingController, actionController);
  }

  ionViewDidLoad() {
    super.ionViewDidLoad();
    this.logger.info(this, 'ionViewDidLoad');
    this.events.subscribe('post:deleted', (post_id:number) => {
      this.logger.info(this, 'Events', 'post:deleted', post_id);
      this.posts = null;
      this.filtered = null;
    });
    this.events.subscribe('post:updated', (post_id:number) => {
      this.logger.info(this, 'Events', 'post:deleted', post_id);
      this.posts = null;
      this.filtered = null;
    });
  }

  ionViewWillEnter() {
    super.ionViewWillEnter();
    this.logger.info(this, "ionViewWillEnter");
    this.deployment = this.navParams.get("deployment");
    this.loadUpdates(null, true);
  }

  loadUpdates(event:any=null, cache:boolean=false) {
    this.logger.info(this, "loadUpdates", "Cache", cache);
    let promises = [
      this.loadFilters(cache),
      this.loadPosts(cache)];
    Promise.all(promises).then(
      (done) => {
        if (event != null) {
          event.complete();
        }
        this.logger.info(this, "loadUpdates", "Done");
      },
      (error) => {
        if (event != null) {
          event.complete();
        }
        this.logger.error(this, "loadUpdates", error);
      });
  }

  loadFilters(cache:boolean=true) {
    if (cache && this.filter) {
      this.logger.info(this, "loadFilters", "Cached", this.filter);
      this.resizeContent();
    }
    else {
      this.database.getFilter(this.deployment).then(
        (results) => {
          this.filter = <Filter>results;
          this.logger.info(this, "loadFilters", "Database", this.filter);
          this.resizeContent();
        },
        (error) => {
          this.logger.error(this, "loadFilters", "Database", error);
        });
    }
  }

  loadPosts(cache:boolean=true) {
    this.logger.info(this, "loadPosts", "Cache", cache);
    if (cache && this.posts != null && this.posts.length > 0) {
      this.logger.info(this, "loadPosts", "Cached", this.posts.length);
    }
    else if (cache) {
      return this.database.getPostsWithValues(this.deployment).then(
        (results) => {
          let posts = <Post[]>results;
          this.logger.info(this, "loadPosts", "Database", posts.length);
          if (posts && posts.length > 0) {
            this.posts = posts;
            this.filtered = this.getFiltered(this.posts, this.filter);
          }
          else {
            this.loadPosts(false);
          }
        },
        (error) => {
          this.logger.error(this, "loadPosts", "Database", error);
        });
    }
    else {
      return this.api.getPostsWithValues(this.deployment).then(
        (results) => {
          this.posts = <Post[]>results;
          this.filtered = this.getFiltered(this.posts, this.filter);
          this.logger.info(this, "loadPosts", "API", this.posts.length);
          for (let post of this.posts) {
            this.database.savePost(this.deployment, post);
            for (let value of post.values) {
              this.database.saveValue(this.deployment, value);
            }
          }
        },
        (error) => {
          this.logger.error(this, "loadPosts", "API", error);
        });
    }
  }

  getFiltered(posts:Post[], filter:Filter): Post[] {
    let filtered: Post[] = [];
    for (let post of posts) {
      if (filter == null) {
        filtered.push(post);
      }
      else if (filter.showPost(post)) {
        filtered.push(post);
      }
    }
    return filtered;
  }

  showResponse(post:Post) {
    this.logger.info(this, "showResponse", post);
    this.showPage(ResponseDetailsPage,
      { deployment: this.deployment,
        post: post });
  }

  addResponse(event:any) {
    this.logger.info(this, "addResponse");
    let buttons = [];
    if (this.deployment.forms != null) {
      for (let form of this.deployment.forms){
        buttons.push({
          text: form.name,
          handler: () => {
            this.logger.info(this, "addResponse", "Form", form);
            this.showResponseAdd(form);
        }});
      }
    }
    buttons.push({
      text: 'Cancel',
      role: 'cancel'});
    this.showActionSheet('Submit a survey response', buttons);
  }

  showResponseAdd(form) {
    let modal = this.showModal(ResponseAddPage,
      { form: form,
        deployment: this.deployment })
    modal.onDidDismiss(data => {
      this.logger.info(this, "showResponseAdd", "Modal", data);
    });
  }

  searchResponses(event:any) {
    this.logger.info(this, "searchResponses");
    let modal = this.showModal(ResponseSearchPage,
      { deployment: this.deployment,
        filter: this.filter });
    modal.onDidDismiss(data => {
      this.logger.info(this, "searchResponses", "Modal", data);
      if (data) {
        this.filter = data['filter'];
        this.filtered = this.getFiltered(this.posts, this.filter);
      }
      this.resizeContent();
    });
  }

  shareResponses(event:any) {
    let subject = this.deployment.name;
    let message = this.deployment.description
    let file = this.deployment.image;
    let url = this.deployment.url;
    this.logger.info(this, "shareResponses", "Subject", subject, "Message", message, "File", file, "URL", url);
    this.showShare(subject, message, file, url).then(
      (shared) => {
        if (shared) {
          this.showToast("Responses Shared");
        }
      },
      (error) => {
        this.showToast(error);
    });
  }

  showOptions(post:Post) {
    this.logger.info(this, "showOptions");
    let buttons = [];
    if (post.can_read) {
      buttons.push({
        text: 'Share',
        handler:() => this.shareResponse(post)
      });
    }
    if (this.offline == false && post.can_update) {
      buttons.push({
         text: 'Edit',
         handler:() => this.editResponse(post)
       });
      if (this.deployment.collections && this.deployment.collections.length > 0) {
        buttons.push({
          text: 'Add to Collection',
          handler:() => this.addToCollection(post)
        });
      }
      if (post.status == 'published' || post.status == 'draft') {
       buttons.push({
         text: 'Archive',
         handler:() => this.archiveResponse(post)
       });
      }
      if (post.status == 'archived' || post.status == 'draft') {
        buttons.push({
          text: 'Publish',
          handler:() => this.publishResponse(post)
        });
      }
    }
    if (this.offline == false && post.can_delete) {
      buttons.push({
        text: 'Delete',
        role: 'destructive',
        handler:() => this.deleteResponse(post)
      });
    }
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });
   this.showActionSheet(null, buttons);
  }

  shareResponse(post:Post) {
    let subject:string = `${this.deployment.name} | ${post.title}`;
    let message:string = post.description
    let file:string = post.image_url;
    let url:string = post.url;
    this.logger.info(this, "shareResponse", "Subject", subject, "Message", message, "File", file, "URL", url);
    this.showShare(subject, message, file, url).then(
      (shared) => {
        if (shared) {
          this.showToast("Response Shared");
        }
      },
      (error) => {
        this.showToast(error);
    });
  }

  editResponse(post:Post) {
    this.logger.info(this, "editResponse", "Post", post);
    let modal = this.showModal(ResponseAddPage,
      { deployment: this.deployment,
        form: this.getForm(post.form_id),
        post: post });
    modal.onDidDismiss(data => {
      this.logger.info(this, "editResponse", "Modal", data);
    });
  }

  getForm(id:number) : Form {
    for (let form of this.deployment.forms) {
      if (form.id == id) {
        return form;
      }
    }
    return null;
  }

  addToCollection(post:Post, collection:Collection=null) {
    this.logger.info(this, "addToCollection");
    if (collection != null) {
      let loading = this.showLoading("Adding...");
      this.api.addPostToCollection(this.deployment, post, collection).then(
        (results) => {
          loading.dismiss();
          this.showToast("Added To Collection");
        },
        (error) => {
          loading.dismiss();
          this.showAlert("Problem Adding To Collection", error);
      })
    }
    else if (this.deployment.collections != null) {
      let buttons = [];
      for (let index in this.deployment.collections) {
        let collection:Collection = this.deployment.collections[index];
        buttons.push({
          text: collection.name,
          handler:() => this.addToCollection(post, collection)
        });
      }
      buttons.push({
        text: 'Cancel',
        role: 'cancel'
      });
      this.showActionSheet("Select Collection", buttons);
    }
  }

  archiveResponse(post:Post) {
    this.logger.info(this, "archiveResponse");
    let loading = this.showLoading("Archiving...");
    let changes = { status: "archived" };
    this.api.updatePost(this.deployment, post, changes).then(
      (updated) => {
        post.status = "archived";
        this.database.savePost(this.deployment, post).then(saved => {
          loading.dismiss();
          this.showToast("Responsed archived");
        });
      },
      (error) => {
        loading.dismiss();
        this.showAlert("Problme Updating Response", error);
      });
  }

  publishResponse(post:Post) {
    this.logger.info(this, "publishResponse");
    let loading = this.showLoading("Publishing...");
    let changes = { status: "published" };
    this.api.updatePost(this.deployment, post, changes).then(
      (updated) => {
        post.status = "published";
        this.database.savePost(this.deployment, post).then(saved => {
          loading.dismiss();
          this.showToast("Response archived");
        });
      },
      (error) => {
        loading.dismiss();
        this.showAlert("Problem Updating Response", error);
      });
  }

  deleteResponse(post:Post) {
    let buttons = [
       {
         text: 'Delete',
         role: 'destructive',
         handler: () => {
           this.logger.info(this, "deleteResponse", 'Delete');
           let loading = this.showLoading("Deleting...");
           this.api.deletePost(this.deployment, post).then(
             (results) => {
               loading.dismiss();
               this.database.removePost(this.deployment, post).then(removed => {
                 let postIndex = this.posts.indexOf(post, 0);
                 if (postIndex > -1) {
                   this.posts.splice(postIndex, 1);
                 }
                 let filteredIndex = this.filtered.indexOf(post, 0);
                 if (filteredIndex > -1) {
                   this.filtered.splice(filteredIndex, 1);
                 }
                 this.showToast("Response deleted");
              });
             },
             (error) => {
               loading.dismiss();
               this.showAlert("Problem Deleting Response", error);
             });
         }
       },
       {
         text: 'Cancel',
         role: 'cancel',
         handler: () => {
           this.logger.info(this, "deleteResponse", 'Cancel');
         }
       }
     ];
     this.showConfirm("Delete Response", "Are you sure you want to delete this response?", buttons);
  }

  showList(event:any) {
    this.logger.info(this, "showList");
    this.view = 'list';
  }

  showMap(event:any, attempts:number=0) {
    this.logger.info(this, "showMap", attempts);
    this.view = 'map';
    this.mapsAPILoader.load().then(() => {
      this.logger.info(this, "showMap", "mapsAPILoader");
      this.latLngBounds = new google.maps.LatLngBounds();
      for (let post of this.filtered) {
        if (post.latitude && post.longitude) {
          this.latLngBounds.extend(new google.maps.LatLng(post.latitude, post.longitude));
        }
	    }
      this.logger.info(this, "showMap", "mapsAPILoader", this.latLngBounds);
    });
  }

  clearFilter(event:any, filter:Filter) {
    this.logger.info(this, "clearFilter", filter);
    this.database.removeFilters(this.deployment).then(
      (results) => {
        this.filter = null;
        this.filtered = this.getFiltered(this.posts, this.filter);
      },
      (error) => {
        this.showToast(error);
      });
      this.resizeContent();
  }

}
