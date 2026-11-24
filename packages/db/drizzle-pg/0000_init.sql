CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"monthly_budget" bigint,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"notify_budget" boolean DEFAULT true NOT NULL,
	"notify_daily_reminder" boolean DEFAULT true NOT NULL,
	"notify_monthly_summary" boolean DEFAULT true NOT NULL,
	"notify_recurring" boolean DEFAULT true NOT NULL,
	"notify_debts" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '📦' NOT NULL,
	"color" text DEFAULT '#64748b' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"budget" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text,
	"wallet_id" text,
	"amount" bigint NOT NULL,
	"note" text,
	"date" date NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"recurring_id" text,
	"original_amount" bigint,
	"original_currency" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text,
	"amount" bigint NOT NULL,
	"source" text DEFAULT 'salary' NOT NULL,
	"note" text,
	"date" date NOT NULL,
	"recurring_id" text,
	"original_amount" bigint,
	"original_currency" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recurring_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'expense' NOT NULL,
	"category_id" text,
	"source" text,
	"amount" bigint NOT NULL,
	"note" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"frequency" text NOT NULL,
	"start_date" date NOT NULL,
	"next_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "debt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"direction" text NOT NULL,
	"person" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"note" text,
	"date" date NOT NULL,
	"due_date" date,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "debt_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"debt_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goal_contribution" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saving_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '🎯' NOT NULL,
	"target" bigint NOT NULL,
	"currency" text NOT NULL,
	"deadline" date,
	"achieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expense_tag" (
	"expense_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "expense_tag_expense_id_tag_id_pk" PRIMARY KEY("expense_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '👛' NOT NULL,
	"currency" text NOT NULL,
	"opening_balance" bigint DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"from_wallet_id" text NOT NULL,
	"to_wallet_id" text NOT NULL,
	"amount_out" bigint NOT NULL,
	"amount_in" bigint NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_recurring_id_recurring_rule_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_rule"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_recurring_id_recurring_rule_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_rule"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rule" ADD CONSTRAINT "recurring_rule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rule" ADD CONSTRAINT "recurring_rule_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt" ADD CONSTRAINT "debt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_debt_id_debt_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contribution" ADD CONSTRAINT "goal_contribution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contribution" ADD CONSTRAINT "goal_contribution_goal_id_saving_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."saving_goal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saving_goal" ADD CONSTRAINT "saving_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_tag" ADD CONSTRAINT "expense_tag_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_tag" ADD CONSTRAINT "expense_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transfer" ADD CONSTRAINT "wallet_transfer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transfer" ADD CONSTRAINT "wallet_transfer_from_wallet_id_wallet_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transfer" ADD CONSTRAINT "wallet_transfer_to_wallet_id_wallet_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_user_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credential_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "category_user_name_uq" ON "category" USING btree ("user_id","name") WHERE "category"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "expense_user_date_idx" ON "expense" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "expense_user_category_idx" ON "expense" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_recurring_date_uq" ON "expense" USING btree ("recurring_id","date");--> statement-breakpoint
CREATE INDEX "income_user_date_idx" ON "income" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "income_recurring_date_uq" ON "income" USING btree ("recurring_id","date");--> statement-breakpoint
CREATE INDEX "recurring_user_idx" ON "recurring_rule" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_due_idx" ON "recurring_rule" USING btree ("active","next_date");--> statement-breakpoint
CREATE INDEX "debt_user_idx" ON "debt" USING btree ("user_id","settled_at");--> statement-breakpoint
CREATE INDEX "debt_payment_debt_idx" ON "debt_payment" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX "goal_contribution_goal_idx" ON "goal_contribution" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "saving_goal_user_idx" ON "saving_goal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expense_tag_tag_idx" ON "expense_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_user_name_uq" ON "tag" USING btree ("user_id","name") WHERE "tag"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "wallet_user_idx" ON "wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_transfer_user_idx" ON "wallet_transfer" USING btree ("user_id","date");