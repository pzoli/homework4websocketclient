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
  private socket: WebSocket | undefined = undefined;
  public sourceName = environment.SOURCE_NAME;
  public mediaRecorder: MediaRecorder | undefined = undefined;
  public stream: MediaStream | undefined = undefined;

  ngOnInit() {
  }

  public startRecording() {
    this.socket = new WebSocket(environment.WEBSOCKET_URL);
    this.socket.onclose = () => console.log('WebSocket connection closed');
    this.socket.onopen = () => this.socket!.send('[source]:'+this.sourceName); this.startCamera();
    this.socket.onerror = (error) => console.error('WebSocket error:', error);
  }

  public stopRecording() {
    this.mediaRecorder!.stop();
    this.stream!.getTracks().forEach(track => track.stop());
    this.socket!.close();
    this.mediaRecorder = undefined;
    this.stream = undefined;
  }

  async startCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 800, height: 600, frameRate: 20 } , audio: true
    });
    this.videoElement.nativeElement.srcObject = this.stream;

    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      //videoBitsPerSecond: 500000
    };

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.socket != undefined && this.socket!.readyState === WebSocket.OPEN) {
        this.socket.send(event.data);
      }
    };

    this.mediaRecorder.start(1000); 
  }
}
