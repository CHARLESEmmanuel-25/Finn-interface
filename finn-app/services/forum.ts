import AsyncStorage from "@react-native-async-storage/async-storage";

const FORUM_STORAGE_KEY = "finn_forum_posts";

export interface ForumComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  stockSymbol?: string;
  stockName?: string;
  createdAt: string;
  likes: string[]; // userIds
  comments: ForumComment[];
}

const SAMPLE_POSTS: ForumPost[] = [
  {
    id: "sample_1",
    userId: "user_sample_1",
    userName: "Marie Dubois",
    content: "AAPL franchit les 280$ aujourd'hui ! Bull run confirmé selon moi. J'ai ajouté à mon portfolio. Qui d'autre est long sur Apple ? 📈",
    stockSymbol: "AAPL",
    stockName: "Apple Inc.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: [],
    comments: [
      {
        id: "c1",
        userId: "user_sample_2",
        userName: "Thomas Martin",
        content: "Moi aussi ! Les résultats Q4 vont être solides.",
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "sample_2",
    userId: "user_sample_2",
    userName: "Thomas Martin",
    content: "NVIDIA et AMD : le duo gagnant de l'IA. Je mise sur les deux pour le long terme. La demande en GPU ne va pas ralentir.",
    stockSymbol: "NVDA",
    stockName: "NVIDIA Corporation",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "sample_3",
    userId: "user_sample_3",
    userName: "Sophie Leroy",
    content: "Petit rappel : diversifiez vos portefeuilles ! Ne mettez pas tout dans la tech. Healthcare et consumer goods offrent de bonnes opportunités en ce moment.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: [],
    comments: [],
  },
];

export async function getForumPosts(): Promise<ForumPost[]> {
  try {
    const data = await AsyncStorage.getItem(FORUM_STORAGE_KEY);
    if (!data) {
      await AsyncStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(SAMPLE_POSTS));
      return [...SAMPLE_POSTS].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    const posts: ForumPost[] = JSON.parse(data);
    return posts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Erreur chargement forum:", error);
    return [];
  }
}

export async function createForumPost(
  post: Omit<ForumPost, "id" | "createdAt" | "likes" | "comments">
): Promise<ForumPost> {
  const newPost: ForumPost = {
    ...post,
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  };
  const posts = await getForumPosts();
  posts.unshift(newPost);
  await AsyncStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}

export async function toggleLike(postId: string, userId: string): Promise<ForumPost | null> {
  const posts = await getForumPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const idx = post.likes.indexOf(userId);
  if (idx >= 0) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(userId);
  }
  await AsyncStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(posts));
  return post;
}

export async function addComment(
  postId: string,
  comment: { userId: string; userName: string; content: string }
): Promise<ForumComment | null> {
  const posts = await getForumPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const newComment: ForumComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: comment.userId,
    userName: comment.userName,
    content: comment.content.trim(),
    createdAt: new Date().toISOString(),
  };
  post.comments.push(newComment);
  await AsyncStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(posts));
  return newComment;
}
