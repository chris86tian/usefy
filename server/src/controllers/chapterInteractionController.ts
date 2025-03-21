import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import ChapterInteraction from "../models/chapterInteractionModel";

export const getChapterInteraction = async (req: Request, res: Response) => {
    const { chapterId } = req.params;

    try {
        const interactions = await ChapterInteraction.query("chapterId").eq(chapterId).exec();
        res.json(interactions);
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching interactions", error: err.message });
    }
};

export const toggleChapterLike = async (req: Request, res: Response) => {
    const { chapterId } = req.params;
    const { userId } = getAuth(req);
  
    try {
        let interaction = await ChapterInteraction.get({ chapterId, userId: userId as string });

      if (!interaction) {
        interaction = new ChapterInteraction({ chapterId, userId, like: true, dislike: false });
      } else {
        if (interaction.like) {
          interaction.like = false; // Toggle off
        } else {
          interaction.like = true;
          interaction.dislike = false; // Remove dislike if it was there
        }
      }
  
      await interaction.save();
      res.json({ message: "Like status updated", interaction });
    } catch (err: any) {
      res.status(500).json({ message: "Error toggling like", error: err.message });
    }
  };
  
export const toggleChapterDislike = async (req: Request, res: Response) => {
    const { chapterId } = req.params;
    const { userId } = getAuth(req);
  
    try {
        let interaction = await ChapterInteraction.get({ chapterId, userId: userId as string });
  
      if (!interaction) {
        interaction = new ChapterInteraction({ chapterId, userId, dislike: true, like: false });
      } else {
        if (interaction.dislike) {
          interaction.dislike = false;
        } else {
          interaction.dislike = true;
          interaction.like = false;
        }
      }
  
      await interaction.save();
      res.json({ message: "Dislike status updated", interaction });
    } catch (err: any) {
      res.status(500).json({ message: "Error toggling dislike", error: err.message });
    }
  };
  

  export const getChapterReactionCount = async (req: Request, res: Response) => {
    const { chapterId } = req.params;
  
    try {
      const result = await ChapterInteraction.query("chapterId").eq(chapterId).exec();
  
      const likes = result.filter((i: any) => i.like).length;
      const dislikes = result.filter((i: any) => i.dislike).length;
  
      res.json({ likes, dislikes });
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching like/dislike counts", error: err.message });
    }
  };
  
  