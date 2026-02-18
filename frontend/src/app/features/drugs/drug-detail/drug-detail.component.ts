import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DrugsService, Drug } from '../../../core/services/drugs.service';
import { DiscussionsService, Discussion } from '../../../core/services/discussions.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-drug-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './drug-detail.component.html',
  styleUrl: './drug-detail.component.scss',
})
export class DrugDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private drugsService = inject(DrugsService);
  private discussionsService = inject(DiscussionsService);
  authService = inject(AuthService);

  drug = signal<Drug | null>(null);
  discussions = signal<Discussion[]>([]);
  loading = signal(true);
  newComment = '';
  replyTo: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDrug(id);
      this.loadDiscussions(id);
    }
  }

  loadDrug = (id: string) => {
    this.drugsService.getById(id).subscribe({
      next: (drug) => {
        this.drug.set(drug);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  loadDiscussions = (drugId: string) => {
    this.discussionsService.getByDrug(drugId).subscribe({
      next: (discussions) => {
        this.discussions.set(discussions);
      },
    });
  };

  submitComment = () => {
    const drug = this.drug();
    if (!drug || !this.newComment.trim()) return;

    this.discussionsService.create(drug.id, this.newComment.trim(), this.replyTo || undefined).subscribe({
      next: () => {
        this.newComment = '';
        this.replyTo = null;
        this.loadDiscussions(drug.id);
      },
    });
  };

  setReplyTo = (discussionId: string) => {
    this.replyTo = discussionId;
  };

  cancelReply = () => {
    this.replyTo = null;
  };

  deleteComment = (id: string) => {
    const drug = this.drug();
    if (!drug) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.discussionsService.delete(id).subscribe({
        next: () => {
          this.loadDiscussions(drug.id);
        },
      });
    }
  };

  getThreadedDiscussions = (): { discussion: Discussion; replies: Discussion[] }[] => {
    const discussions = this.discussions();
    const topLevel = discussions.filter((d) => !d.parent_id);
    return topLevel.map((d) => ({
      discussion: d,
      replies: discussions.filter((r) => r.parent_id === d.id),
    }));
  };
}
