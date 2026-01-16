
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { addDoc, collection, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import { Paperclip, Image as ImageIcon, MapPin, Mic, Loader2, X, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/types';
import { uploadImage, uploadVideo } from '@/firebase/storage';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function RecordVideoDialog({ isOpen, onOpenChange, onVideoRecorded }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onVideoRecorded: (file: File) => void }) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Video recording is not supported on this browser." });
      setHasPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      setHasPermission(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({ variant: "destructive", title: "Camera Access Denied", description: "Please enable camera and microphone permissions in your browser settings." });
      setHasPermission(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      getCameraPermission();
    } else {
      // Stop camera stream when dialog is closed
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsRecording(false);
      mediaRecorderRef.current = null;
      recordedChunks.current = [];
      setHasPermission(null);
    }
  }, [isOpen, getCameraPermission]);


  const handleStartRecording = () => {
    if (mediaRecorderRef.current) {
      recordedChunks.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const videoFile = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        onVideoRecorded(videoFile);
        onOpenChange(false);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {hasPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and microphone access in your browser to use this feature.
              </AlertDescription>
            </Alert>
          )}
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                REC
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          {isRecording ? (
            <Button onClick={handleStopRecording} variant="destructive">Stop Recording</Button>
          ) : (
            <Button onClick={handleStartRecording} disabled={!hasPermission}>Start Recording</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type MediaFile = {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export function NewPost() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecordVideoOpen, setIsRecordVideoOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, `users/${user.uid}`) : null), [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMediaFiles: MediaFile[] = files.map(file => {
        const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : null);
        if (!type) {
          toast({ variant: 'destructive', title: "Unsupported File", description: `File ${file.name} is not a supported image or video format.` });
          return null;
        }
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          type,
        };
      }).filter((mediaFile): mediaFile is MediaFile => mediaFile !== null);

      setMediaFiles(prev => [...prev, ...newMediaFiles]);
    }
  };

  const handleVideoRecorded = (file: File) => {
    setMediaFiles(prev => [...prev, {
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'video'
    }]);
  };


  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handlePost = async () => {
    if ((!content.trim() && mediaFiles.length === 0) || !user || !firestore) return;

    setIsLoading(true);
    try {
      const uploadedMedia = await Promise.all(
        mediaFiles.map(async (media) => {
          const path = `posts/${user.uid}/${Date.now()}_${media.file.name}`;
          let url: string;
          if (media.type === 'image') {
            url = await uploadImage(media.file, path);
          } else {
            url = await uploadVideo(media.file, path);
          }
          return { url, type: media.type };
        })
      );

      const postsCollection = collection(firestore, 'posts');
      await addDoc(postsCollection, {
        authorId: user.uid,
        content,
        media: uploadedMedia,
        category: category,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        city: userProfile?.city,
        country: userProfile?.country
      });

      setContent('');
      setCategory('general');
      setMediaFiles([]);

      toast({
        title: 'Post created!',
        description: 'Your post is now live for the community to see.',
      });
    } catch (error: any) {
      console.error("Error creating post:", error);
      let errorMessage = "Failed to create post. Please try again.";

      if (error.code === 'permission-denied') {
        errorMessage = "You do not have permission to post. Please ensure your account is verified.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error creating post',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !userProfile) return null;

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Textarea
                placeholder="What's happening in your neighborhood?"
                className="border-none text-base focus-visible:ring-0 resize-none shadow-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative aspect-square">
                      {media.type === 'image' ? (
                        <Image src={media.previewUrl} alt={`Preview ${index}`} fill className="rounded-lg object-cover" />
                      ) : (
                        <video src={media.previewUrl} className="rounded-lg object-cover w-full h-full" />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => removeMedia(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <ImageIcon className="h-5 w-5" />
                    <span className="sr-only">Add Image or Video</span>
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple />

                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsRecordVideoOpen(true)} disabled={isLoading}>
                    <Video className="h-5 w-5" />
                    <span className="sr-only">Record Video</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-[120px]">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="housing">Housing</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="rounded-full" onClick={handlePost} disabled={isLoading || (!content.trim() && mediaFiles.length === 0)}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <RecordVideoDialog isOpen={isRecordVideoOpen} onOpenChange={setIsRecordVideoOpen} onVideoRecorded={handleVideoRecorded} />
    </>
  );
}
