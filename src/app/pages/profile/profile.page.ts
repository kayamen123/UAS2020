import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Camera, CameraResultType, CameraSource, Capacitor } from '@capacitor/core';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('filePicker', { static: false }) filePickerRef: ElementRef<HTMLInputElement>;
  userEmail: string;
  userID: string;
  namaDepan: string;
  isDesktop: boolean;
  namaBelakang: string;
  dataUrl: any;
  photo: SafeResourceUrl;
  user: any ;
  constructor(
    private navCtrl: NavController,
    private authSrv: AuthService,
    private userSrv: UserService,
    private storage: AngularFireStorage,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private platform: Platform,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(){
      this.authSrv.userDetails().subscribe(res => {
        console.log('res: ', res);
        console.log('uid ', res.uid);
        if(res !== null){
          this.userEmail = res.email;
          this.userSrv.getAll('user').snapshotChanges().pipe(
            map(changes => 
              changes.map(c => ({key: c.payload.key, ...c.payload.val()}))  
            )
          ).subscribe(data => {
            this.user = data;
            console.log(this.user);
            console.log(this.userEmail);
            this.user = this.user.filter(User => {
                return User.email == this.userEmail
            });
            console.log(this.user);
            this.photo = this.user[0].imageUrl;
            this.namaDepan = this.user[0].nDepan;
            this.namaBelakang =this.user[0].nBelakang
            this.dataUrl = this.photo;
            console.log(this.namaDepan);
            console.log(this.namaBelakang);
            /*for(let i = 0; i < this.user.length;){
                if(this.user[i].email === this.userEmail){
                  this.photo = this.user[i].imageUrl;
                }
                i++;
            }*/
          });
        }else {
          this.navCtrl.navigateBack('');
        }
      }, err => {
        console.log(err);
      });
      if((this.platform.is('mobile') && this.platform.is('hybrid')) || 
      this.platform.is('desktop')){
        this.isDesktop = true;
      }
  }

  async getPicture(type: string){
    if(!Capacitor.isPluginAvailable('Camera') || (this.isDesktop && type === 'gallery')){
      this.filePickerRef.nativeElement.click();
      return;
    }
    const image = await Camera.getPhoto({
      quality: 100,
      width: 400,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      saveToGallery: true
    });
    this.dataUrl = image.dataUrl;
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));
  }

  onFileChoose(event: Event){
    const file = (event.target as HTMLInputElement).files[0];
    const pattern = /image-*/;
    const reader = new FileReader();

    if(!file.type.match(pattern)){
      console.log('File Format not supported');
      return;
    }

    reader.onload = () => {
      this.photo = reader.result.toString();
    };
    reader.readAsDataURL(file);
  }

  dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {type: mime});
  }

  upload(){
    this.presentLoading().then(() => {
        const file = this.dataURLtoFile(this.dataUrl, 'file');
        console.log('file :', file);
        const filePath = 'photos/'+this.namaDepan+'.jpg';
        const ref = this.storage.ref(filePath)
        const task = ref.put(file);
        this.userSrv.updateProfile(this.user[0],this.dataUrl);
        this.presentToast();
    });

  }

  
  async presentToast(){
    let toast = this.toastCtrl.create({
      message: 'Profile Telah diUpload',
      color: 'primary',
      duration: 1000,
      position: 'bottom',
    });
  
    (await toast).present();
  }
  
  async presentLoading() {
    const loading = await this.loadingCtrl.create({
      message: "Upload Profile....",
      duration: 5000,
    });
    await loading.present();
  
    await loading.onDidDismiss();
  }

  async presentToast2(){
    let toast = this.toastCtrl.create({
      message: 'User Telah Logout',
      color: 'primary',
      duration: 1000,
      position: 'bottom',
    });
  
    (await toast).present();
  }
  
  async presentLoading2() {
    const loading = await this.loadingCtrl.create({
      message: "Logout....",
      duration: 5000,
    });
    await loading.present();
  
    await loading.onDidDismiss();
  }


  logout(){
    this.presentLoading2().then(() => {
          this.authSrv.logoutUser()
        .then(res => {
          console.log(res);
          this.presentToast2
          this.navCtrl.navigateBack('');
        })
        .catch(error => {
          console.log(error);
        });
    });

  }

}
