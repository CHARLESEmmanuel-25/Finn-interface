import AsyncStorage from "@react-native-async-storage/async-storage";

const FORUM_STORAGE_KEY = "finn_forum_posts";

export type ForumCategory = "analyses" | "debutants" | "actualites" | "general";

export interface ForumComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  title?: string;
  stockSymbol?: string;
  stockName?: string;
  stockPrice?: number;
  category?: ForumCategory;
  pinned?: boolean;
  createdAt: string;
  likes: string[]; // userIds
  comments: ForumComment[];
}

const SAMPLE_POSTS: ForumPost[] = [
  {
    id: "sample_1",
    userId: "user_sample_1",
    userName: "Marie Dubois",
    category: "analyses",
    pinned: true,
    title: "AAPL franchit les 280$ — bull run confirmé ou correction à venir ?",
    content:
      "AAPL franchit les 280$ aujourd'hui. Volume en forte hausse depuis l'annonce des résultats. Qui d'autre suit cette action ?",
    stockSymbol: "AAPL",
    stockName: "Apple Inc.",
    stockPrice: 280.43,
    createdAt: new Date("2025-02-15T09:14:00").toISOString(),
    likes: [],
    comments: [
      {
        id: "c1",
        userId: "user_sample_2",
        userName: "Thomas Martin",
        content:
          "Le volume confirme l'intérêt, mais le RSI commence à approcher la zone de surachat. Je resterais prudent à court terme.",
        createdAt: new Date("2025-02-15T10:02:00").toISOString(),
        likes: 8,
      },
      {
        id: "c2",
        userId: "user_sample_3",
        userName: "Sarah Lemoine",
        content:
          "D'accord avec Thomas. Le PER d'Apple est déjà élevé par rapport au secteur, j'attends une consolidation avant d'ajouter.",
        createdAt: new Date("2025-02-15T11:47:00").toISOString(),
        likes: 5,
      },
    ],
  },
  {
    id: "sample_2",
    userId: "user_sample_2",
    userName: "Thomas Martin",
    category: "debutants",
    title: "NVIDIA et AMD : comment comparer leurs marges ?",
    content:
      "NVIDIA et AMD : comment comparer leurs marges ? Je cherche des ressources pour analyser les deux sociétés avant d'investir.",
    stockSymbol: "NVDA",
    stockName: "NVIDIA Corporation",
    createdAt: new Date("2025-02-15T10:00:00").toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "sample_3",
    userId: "user_sample_3",
    userName: "Sarah Lemoine",
    category: "actualites",
    title: "Inflation US en baisse — quel impact sur les taux de la Fed ?",
    content:
      "Les chiffres de l'inflation US sont en baisse ce mois-ci. Quelles conséquences attendez-vous sur la politique de la Fed et les marchés ?",
    createdAt: new Date("2025-02-14T08:30:00").toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "sample_4",
    userId: "user_sample_4",
    userName: "Lucas Bernard",
    category: "general",
    title: "Votre stratégie de diversification ?",
    content:
      "Petit rappel : diversifiez vos portefeuilles ! Ne mettez pas tout dans la tech. Healthcare et consumer goods offrent de bonnes opportunités.",
    createdAt: new Date("2025-02-13T15:00:00").toISOString(),
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
  } catch {
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
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(userId);
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
    likes: 0,
  };
  post.comments.push(newComment);
  await AsyncStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(posts));
  return newComment;
}
