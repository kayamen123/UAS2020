import { Component, OnInit } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NavController } from '@ionic/angular';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  userEmail: string;
  userID: string;
  namaDepan: string;
  namaBelakang: string;
  photo: SafeResourceUrl;
  user: any ;
  constructor(
    private navCtrl: NavController,
    private authSrv: AuthService,
    private userSrv: UserService
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
  }

  logout(){
    this.authSrv.logoutUser()
        .then(res => {
          console.log(res);
          this.navCtrl.navigateBack('');
        })
        .catch(error => {
          console.log(error);
        });
  }

}
