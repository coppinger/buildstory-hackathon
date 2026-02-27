CREATE INDEX "idx_team_invites_recipient_status" ON "team_invites" USING btree ("recipient_id","type","status");--> statement-breakpoint
CREATE INDEX "idx_team_invites_sender_status" ON "team_invites" USING btree ("sender_id","status");--> statement-breakpoint
CREATE INDEX "idx_team_invites_project_status" ON "team_invites" USING btree ("project_id","status");