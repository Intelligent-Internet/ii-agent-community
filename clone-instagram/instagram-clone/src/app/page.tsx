import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import Feed from "@/components/feed/Feed";

export default function Home() {
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <Feed />
      </MainLayout>
    </AuthGuard>
  );
}
