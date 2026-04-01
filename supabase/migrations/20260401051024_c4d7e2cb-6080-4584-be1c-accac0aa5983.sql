
-- 1. Fix chat_messages INSERT policy to validate resume ownership
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own messages"
ON public.chat_messages FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.resumes
    WHERE resumes.id = resume_id
    AND resumes.user_id = auth.uid()
  )
);

-- 2. Add DELETE policy for chat_messages (owner only)
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
TO public
USING (auth.uid() = user_id);

-- 3. Add UPDATE policy for chat_messages (owner only)
CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- 4. Add UPDATE policy for resumes storage bucket (owner only)
CREATE POLICY "Users can update their own resume files"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);
