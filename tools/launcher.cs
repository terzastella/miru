using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class MiRuLauncher
{
    [STAThread]
    static int Main(string[] args)
    {
        bool dev = args.Length > 0 && args[0] == "--dev";
        string appDir = AppDomain.CurrentDomain.BaseDirectory;

        string node = FindNode();
        if (node == null)
        {
            Console.WriteLine();
            Console.WriteLine("  [ERRORE] Node.js non trovato.");
            Console.WriteLine("  Scaricalo da https://nodejs.org e riprova.");
            Console.WriteLine();
            Console.WriteLine("Premi Invio per chiudere...");
            Console.ReadLine();
            return 1;
        }

        if (!Directory.Exists(Path.Combine(appDir, "node_modules")))
        {
            Console.WriteLine("Installazione delle dipendenze (serve internet)...");
            if (Run(appDir, "npm.cmd", "install") != 0)
            {
                Console.WriteLine();
                Console.WriteLine("  [ERRORE] Installazione fallita.");
                Console.WriteLine("Premi Invio per chiudere...");
                Console.ReadLine();
                return 1;
            }
        }

        if (!dev && !Directory.Exists(Path.Combine(appDir, ".next")))
        {
            Console.WriteLine("Compilazione della build di produzione...");
            if (Run(appDir, "npm.cmd", "run build") != 0)
            {
                Console.WriteLine();
                Console.WriteLine("  [ERRORE] Compilazione fallita.");
                Console.WriteLine("Premi Invio per chiudere...");
                Console.ReadLine();
                return 1;
            }
        }

        string command = dev ? "npm run dev" : "npm start";
        var psi = new ProcessStartInfo("cmd.exe")
        {
            Arguments = "/k title MIRU server && " + command,
            WorkingDirectory = appDir,
            UseShellExecute = true,
        };
        Process.Start(psi);

        Console.WriteLine("MIRU in avvio su: http://localhost:3000");
        Thread.Sleep(dev ? 7000 : 6000);
        try { Process.Start("http://localhost:3000"); }
        catch { }

        Console.WriteLine();
        Console.WriteLine("Per fermare MIRU: chiudi la finestra \"MIRU server\".");
        Console.WriteLine();
        Console.WriteLine("Premi Invio per chiudere questa finestra...");
        Console.ReadLine();
        return 0;
    }

    static string FindNode()
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string dir in path.Split(';'))
        {
            if (dir.Length == 0) continue;
            string file = Path.Combine(dir.Trim('"'), "node.exe");
            if (File.Exists(file)) return file;
        }
        string programs = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string common = Path.Combine(programs, "nodejs", "node.exe");
        if (File.Exists(common)) return common;
        return null;
    }

    static int Run(string dir, string file, string args)
    {
        var psi = new ProcessStartInfo(file, args)
        {
            WorkingDirectory = dir,
            UseShellExecute = true,
        };
        using (var p = Process.Start(psi))
        {
            p.WaitForExit();
            return p.ExitCode;
        }
    }
}