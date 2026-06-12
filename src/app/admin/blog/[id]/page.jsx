"use client";
import { useParams } from "react-router";
import AdminBlogFormPage from "@/components/admin/BlogPostForm";

export default function EditBlogPostPage() {
  const { id } = useParams();
  return <AdminBlogFormPage postId={parseInt(id)} />;
}
