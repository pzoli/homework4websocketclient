import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  private socket!: WebSocket;

  ngOnInit() {
    this.socket = new WebSocket(environment.WEBSOCKET_URL);//lenovo-e16g2.me.local
    this.socket.onclose = () => console.log('WebSocket connection closed');
    this.socket.onopen = () => this.startCamera();
    this.socket.onerror = (error) => console.error('WebSocket error:', error);
  }

  async startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1920, height: 1080, frameRate: 20 } , audio: true
    });
    this.videoElement.nativeElement.srcObject = stream;

    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      //videoBitsPerSecond: 500000
    };

    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.socket.readyState === WebSocket.OPEN) {
        // Küldés előtt érdemes ellenőrizni az első csomagot
        this.socket.send(event.data);
      }
    };

    // Ahelyett, hogy manuálisan rángatnád a requestData-t:
    // Indítsd el fix, 1000ms-os időközökkel. 
    // A MediaRecorder így szabályos WebM blokkokat generál.
    mediaRecorder.start(1000); 
  }
}
