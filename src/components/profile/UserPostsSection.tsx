import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2 } from 'lucide-react';
import { PostCard } from './PostCard';
import { CreatePostDialog } from './CreatePostDialog';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useAuth } from '@/hooks/useAuth';

interface UserPostsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const UserPostsSection = ({ userId, isOwnProfile = false }: UserPostsSectionProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { posts, isLoading, refetch } = useUserPosts(userId);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {t('posts.title', 'المنشورات')}
          {posts.length > 0 && (
            <span className="text-sm text-muted-foreground trading-number">
              ({posts.length})
            </span>
          )}
        </h2>
        
        {isOwnProfile && user && (
          <CreatePostDialog userId={userId} />
        )}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={refetch}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 glass-card rounded-xl"
        >
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? t('posts.noPostsOwn', 'لم تنشر أي شيء بعد. شارك تحليلاتك مع المجتمع!')
              : t('posts.noPosts', 'لا توجد منشورات حتى الآن')
            }
          </p>
          {isOwnProfile && user && (
            <div className="mt-4">
              <CreatePostDialog userId={userId} />
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
};
