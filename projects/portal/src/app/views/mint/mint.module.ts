import { MaterialModule } from '../material.module';
import { MintComponent } from './mint.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [MintComponent],
  imports: [CommonModule, RouterModule, FormsModule, MaterialModule],
  exports: [MintComponent],
})
export class MintModule {}
