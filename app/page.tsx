
'use client';
import Image from 'next/image';
import {
  MessageCircle,
  MoreHorizontal,
  Heart,
  Send,
  Loader2,
  Trash2,
  Flag,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NewPost } from '@/components/new-post';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Post as PostType, Like, Comment, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  doc,
  collection,
  deleteDoc,
  writeBatch,
  increment,
  Timestamp,
  query,
  orderBy,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { getCountryFlag } from '@/lib/countries';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';


function PostAuthor({ authorId }: { authorId: string }) {
  const firestore = useFirestore();
  const authorDocRef = useMemoFirebase(() => authorId ? doc(firestore, 'users', authorId) : null, [firestore, authorId]);
  const { data: author, isLoading } = useDoc<UserProfile>(authorDocRef);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-none">
            Unknown User
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={author.avatar} alt={author.displayName} />
        <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold leading-none flex items-center gap-2">
          {author.displayName}
          {author.country && <span>{getCountryFlag(author.country)}</span>}
        </p>
        <p className="text-xs text-muted-foreground">@{author.username}</p>
      </div>
    </div>
  );
}

function CommentDisplay({ comment }: { comment: Comment }) {
  const firestore = useFirestore();
  const authorDocRef = useMemoFirebase(() => comment.authorId ? doc(firestore, 'users', comment.authorId) : null, [comment.authorId, firestore]);
  const { data: author, isLoading } = useDoc<UserProfile>(authorDocRef);

  if (isLoading || !author) {
    return (
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={author.avatar} alt={author.displayName} />
        <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold">
            {author.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {comment.createdAt instanceof Timestamp ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : '...'}
          </p>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const commentsQuery = useMemoFirebase(() => postId ? query(collection(firestore, `posts/${postId}/comments`), orderBy('createdAt', 'asc')) : null, [postId, firestore]);
  const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user || !firestore) return;
    setIsSubmitting(true);
    const commentCollectionRef = collection(firestore, `posts/${postId}/comments`);
    const postRef = doc(firestore, 'posts', postId);

    try {
      const batch = writeBatch(firestore);

      batch.set(doc(commentCollectionRef), {
        authorId: user.uid,
        content: newComment,
        createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0)
      });

      batch.update(postRef, { commentCount: increment(1) });

      await batch.commit();

      setNewComment('');
    } catch (error) {
      console.error("Error submitting comment: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 space-y-4">
      <Separator />
      <h4 className="text-sm font-semibold">Comments</h4>
      {isLoading && <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}

      {comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {comments.map(comment => (
            <CommentDisplay key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        !isLoading && <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first to reply!</p>
      )}

      {user && (
        <div className="flex gap-2 items-start pt-2">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder="Write a comment..."
              className="text-sm"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={handleCommentSubmit} disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportDialog({ post, isOpen, onOpenChange }: { post: PostType, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!reason.trim() || !user || !firestore) return;

    setIsSubmitting(true);
    try {
      const reportsCollection = collection(firestore, 'reports');
      await addDoc(reportsCollection, {
        reporterId: user.uid,
        reportedContentType: 'post',
        reportedContentId: post.id,
        reason: reason,
        status: 'open',
        timestamp: new Timestamp(Math.floor(Date.now() / 1000), 0)
      });
      toast({
        title: 'Report Submitted',
        description: 'Thank you for helping keep the community safe.',
      });
      onOpenChange(false);
      setReason('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Report Failed',
        description: error.message || 'There was an error submitting your report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this post. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., This post contains spam or harmful content."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmitReport} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function PostCard({ post }: { post: PostType }) {
  const timestamp = post.createdAt instanceof Timestamp ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now';
  const firestore = useFirestore();
  const { user } = useUser();
  const [showComments, setShowComments] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const likesCollectionRef = useMemoFirebase(() => post.id ? collection(firestore, `posts/${post.id}/likes`) : null, [post.id, firestore]);
  const { data: likes } = useCollection<Like>(likesCollectionRef);
  const hasLiked = user && likes?.some(like => like.id === user.uid);

  const handleLike = async () => {
    if (!firestore || !user) return;
    const likeRef = doc(firestore, `posts/${post.id}/likes`, user.uid);
    const postRef = doc(firestore, 'posts', post.id);

    try {
      const batch = writeBatch(firestore);
      if (hasLiked) {
        batch.delete(likeRef);
        batch.update(postRef, { likeCount: increment(-1) });
      } else {
        batch.set(likeRef, { createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0), userId: user.uid });
        batch.update(postRef, { likeCount: increment(1) });
      }
      await batch.commit();
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this post on JapaHub!`,
          text: post.content,
          url: `${window.location.origin}/post/${post.id}`,
        })
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('Link copied to clipboard!');
    }
  }

  const handleDelete = async () => {
    if (!firestore || !user || user.uid !== post.authorId) return;
    if (window.confirm("Are you sure you want to delete this post?")) {
      const postRef = doc(firestore, 'posts', post.id);
      try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          await deleteDoc(postRef);
        } else {
          console.warn("Post does not exist, cannot delete.");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  }

  return (
    <>
      <Card className="rounded-lg border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <PostAuthor authorId={post.authorId} />
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{timestamp}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && user.uid === post.authorId ? (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive flex items-center gap-2 cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Post</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <Flag className="h-4 w-4" />
                    <span>Report Post</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0">
          {post.content && <p className="text-sm whitespace-pre-wrap">{post.content}</p>}
          {post.media && post.media.length > 0 && (
            <div className={cn(
              "grid gap-2",
              post.media.length === 1 && "grid-cols-1",
              post.media.length === 2 && "grid-cols-2",
              post.media.length > 2 && "grid-cols-2",
            )}>
              {post.media.map((media, index) => (
                <div key={index} className={cn(
                  "relative overflow-hidden rounded-lg",
                  post.media && post.media.length > 1 ? "aspect-square" : "aspect-video"
                )}>
                  {media.type === 'image' ? (
                    <Image src={media.url} alt={`Post media ${index + 1}`} fill className="object-cover" />
                  ) : (
                    <video src={media.url} controls className="w-full h-full object-cover bg-black" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 p-4 pt-0">
          {(post.likeCount > 0 || post.commentCount > 0) && (
            <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
              {post.likeCount > 0 && (
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span>{post.likeCount} likes</span>
                </div>
              )}
              {post.commentCount > 0 && (
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 hover:underline">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.commentCount} comments</span>
                </button>
              )}
            </div>
          )}
          <Separator />
          <div className="flex w-full justify-around">
            <Button variant="ghost" className="w-full" onClick={handleLike} disabled={!user}>
              <Heart className={cn("mr-2 h-5 w-5", hasLiked && 'fill-red-500 text-red-500')} />
              Like
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="mr-2 h-5 w-5" />
              Comment
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleShare}>
              <Send className="mr-2 h-5 w-5" />
              Share
            </Button>
          </div>
        </CardFooter>
        {showComments && <CommentSection postId={post.id} />}
      </Card>
      <ReportDialog post={post} isOpen={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} />
    </>
  );
}

function PostSkeleton() {
  return (
    <Card className="rounded-lg border">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="aspect-video w-full" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  )
}


export default function CommunityFeedPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  // Only create the query if the user is logged in
  const postsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: posts, isLoading: postsLoading } = useCollection<PostType>(postsQuery);

  if (userLoading || !user) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <NewPost />
      {postsLoading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {!postsLoading && posts?.length === 0 && (
        <Card className="rounded-lg border">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <MessageCircle className="w-12 h-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Your Feed is Empty</h3>
            <p className="text-sm text-muted-foreground">Be the first to share something with your community!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
